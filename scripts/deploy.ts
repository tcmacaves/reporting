import 'dotenv/config'
import {
  deployCloudFormationStack,
  getStackOutputs,
} from '@jcoreio/cloudformation-tools'
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs-extra'
import AWS from 'aws-sdk'
import { getConfig } from '../src/config'

async function go(): Promise<void> {
  process.stderr.write('Creating S3 bucket...')
  const s3stack = 'tcma-s3-internal'
  await deployCloudFormationStack({
    StackName: s3stack,
    TemplateFile: path.resolve(__dirname, 's3.cloudformation.yaml'),
  })
  process.stderr.write('done!\n\n')

  const { BucketName: Bucket } = await getStackOutputs({ StackName: s3stack })

  const zipFileName = 'tcma-reporting.zip'
  const zipFile = path.resolve(__dirname, '..', zipFileName)
  const hash = crypto
    .createHash('md5')
    .update(await fs.readFile(zipFile))
    .digest('hex')

  const deploymentPackageKey = zipFileName.replace(/\.zip$/, `-${hash}.zip`)
  process.stderr.write(
    `Uploading ${zipFileName} to S3 ${Bucket}/${deploymentPackageKey}...`
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
      ReportMonthlyDonations: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket: Bucket,
            S3Key: deploymentPackageKey,
          },
          FunctionName: 'ReportDonationsForPreviousMonth',
          Description: 'Reports donations for the previous month',
          Handler: 'reportDonationsForPreviousMonthXlsx.handler',
          Runtime: 'nodejs12.x',
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
          Description: 'Create donations report monthly',
          ScheduleExpression: 'cron(0 8 1 * ? *)',
          State: 'ENABLED',
          Targets: [
            {
              Arn: { 'Fn::GetAtt': ['ReportMonthlyDonations', 'Arn'] },
              Id: 'TargetFunctionV1',
            },
          ],
        },
      },
      PermissionForEventsToInvokeLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'ReportMonthlyDonations' },
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
}

go().catch((error: Error) => {
  console.error(error.stack) // eslint-disable-line no-console
  process.exit(1)
})
