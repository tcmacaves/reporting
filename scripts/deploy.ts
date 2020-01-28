import 'dotenv/config'
import {
  deployCloudFormationStack,
  getStackOutputs,
} from '@jcoreio/cloudformation-tools'
import md5 from 'md5-file/promise'
import * as path from 'path'
import * as fs from 'fs-extra'
import AWS from 'aws-sdk'
import { getConfig } from '../src/config'
import {
  listObjectsV2,
  deleteObjects,
} from '@jcoreio/aws-sdk-async-iterables/s3'

async function go(): Promise<void> {
  process.stderr.write('Creating S3 bucket...')
  const s3stack = 'tcma-reporting-s3'
  await deployCloudFormationStack({
    StackName: s3stack,
    TemplateFile: path.resolve(__dirname, 's3.cloudformation.yaml'),
  })
  process.stderr.write('done!\n\n')

  const { BucketName: Bucket } = await getStackOutputs({ StackName: s3stack })

  const zipFileName = 'tcma-reporting.zip'
  const zipFile = path.resolve(__dirname, '..', zipFileName)
  const hash = await md5(zipFile)

  const lambdaPrefix = 'lambda/'
  const deploymentPackageKey =
    lambdaPrefix + zipFileName.replace(/\.zip$/, `-${hash}.zip`)
  process.stderr.write(
    `Uploading ${zipFileName} to S3: ${Bucket}/${deploymentPackageKey}...`
  )
  const s3 = new AWS.S3()
  await s3
    .upload({
      Bucket,
      Key: deploymentPackageKey,
      Body: fs.createReadStream(zipFile),
    })
    .promise()
  process.stderr.write('done!\n\n')

  const lambdaStack = 'tcma-reporting-lambda'

  const lambdaTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Creates Lambda functions for tcma-reporting',
    Resources: {
      Role: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          },
          Description: 'Role for Lambda functions',
          Path: '/',
          RoleName: 'LambdaExecutionRole',
        },
      },
      CreateReport: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: Bucket,
            S3Key: deploymentPackageKey,
          },
          FunctionName: 'CreateReport',
          Description: 'Creates various reports',
          Runtime: 'nodejs12.x',
          Handler: 'index.handler',
          Role: { 'Fn::GetAtt': ['Role', 'Arn'] },
          Timeout: 900,
          Environment: {
            Variables: {
              ...getConfig(),
              LAMBDA: '1',
            },
          },
        },
      },
      MonthlyRule: {
        Type: 'AWS::Events::Rule',
        Properties: {
          Description: 'Create monthly donations and preserve visit reports',
          ScheduleExpression: 'cron(0 8 1 * ? *)',
          State: 'ENABLED',
          Targets: [
            {
              Arn: { 'Fn::GetAtt': ['CreateReport', 'Arn'] },
              Id: 'MonthlyDonations',
              Input: JSON.stringify({
                report: 'donations',
                month: 'previous',
              }),
            },
            {
              Arn: { 'Fn::GetAtt': ['CreateReport', 'Arn'] },
              Id: 'MonthlyPreserveVisits',
              Input: JSON.stringify({
                report: 'preserveVisits',
                month: 'previous',
              }),
            },
          ],
        },
      },
      PermissionForEventsToInvokeLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'CreateReport' },
          Action: 'lambda:InvokeFunction',
          Principal: 'events.amazonaws.com',
          SourceArn: { 'Fn::GetAtt': ['MonthlyRule', 'Arn'] },
        },
      },
    },
  }
  process.stderr.write('Creating Lambda functions...')
  await deployCloudFormationStack({
    StackName: lambdaStack,
    Template: lambdaTemplate,
    Capabilities: ['CAPABILITY_NAMED_IAM'],
  })
  process.stderr.write('done!\n\n')

  async function* obsoleteDeploymentPackages(): AsyncIterable<
    AWS.S3.ObjectIdentifier
  > {
    for await (const { Key } of listObjectsV2(s3, {
      Bucket,
      Prefix: lambdaPrefix,
    })) {
      if (Key && Key !== deploymentPackageKey) {
        yield { Key }
      }
    }
  }
  process.stderr.write(`Deleting old lambdas deployment packages in S3...\n`)
  for await (const object of deleteObjects(s3, {
    Bucket,
    Delete: {
      Objects: obsoleteDeploymentPackages(),
    },
  })) {
    process.stderr.write(`Deleted ${object.Key}\n`)
  }
  process.stderr.write('done!\n\n')
}

go().catch((error: Error) => {
  console.error(error.stack) // eslint-disable-line no-console
  process.exit(1)
})
