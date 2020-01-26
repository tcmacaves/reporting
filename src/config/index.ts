import { once } from 'lodash'
import { SITE_BASE_URL } from './constants'
import chalk from 'chalk'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    /* eslint-disable no-console */
    console.error(
      chalk`Missing {bold ${name}} in {bold .env} or environment variables.  Please run {bold yarn setup} and then try again.`
    )
    /* eslint-enable no-console */
    process.exit(1)
    throw new Error('dead code')
  }
  return value
}

type Config = {
  SITE_BASE_URL: string
  GRAVITY_FORMS_CONSUMER_KEY: string
  GRAVITY_FORMS_CONSUMER_SECRET: string
  GOOGLE_DRIVE_FOLDER_ID: string | undefined
}

export const getConfig = once(
  (): Config => ({
    SITE_BASE_URL: process.env.SITE_BASE_URL || SITE_BASE_URL,
    GRAVITY_FORMS_CONSUMER_KEY: requireEnv('GRAVITY_FORMS_CONSUMER_KEY'),
    GRAVITY_FORMS_CONSUMER_SECRET: requireEnv('GRAVITY_FORMS_CONSUMER_SECRET'),
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  })
)
