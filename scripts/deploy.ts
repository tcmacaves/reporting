import 'dotenv/config'
import {
  deployCloudFormationStack,
  getStackOutputs,
} from '@jcoreio/cloudformation-tools'
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

  process.stderr.write('Uploading tcma-reporting.zip to S3...')
  const deploymentPackageKey = 'tcma-reporting.zip'
  const s3 = new AWS.S3()
  await s3
    .upload({
      Bucket,
      Key: deploymentPackageKey,
      Body: fs.createReadStream(
        path.resolve(__dirname, '..', 'tcma-reporting.zip')
      ),
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
