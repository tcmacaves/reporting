/* eslint-disable no-console */

import 'dotenv/config'
import { getGoogleAuth } from '../src/util/google'
import inquirer from 'inquirer'
import dotenv from 'dotenv'
import * as fs from 'fs-extra'
import * as path from 'path'
import chalk from 'chalk'
import { map } from 'lodash'

async function addToDotenv(vars: Record<string, string>): Promise<void> {
  const parsed = dotenv.config().parsed || {}
  await fs.writeFile(
    '.env',
    map({ ...parsed, ...vars }, (value, key) => `${key}=${value}`).join('\n'),
    'utf8'
  )
}

async function go(): Promise<void> {
  if (
    !process.env.GRAVITY_FORMS_CONSUMER_KEY ||
    !process.env.GRAVITY_FORMS_CONSUMER_SECRET
  ) {
    console.log(chalk`Visit this URL to authorize Gravity Forms access:

  https://www.tcmacaves.org/wp-admin/admin.php?page=gf_settings&subview=gravityformswebapi&action=edit&key_id=0

If the URL doesn't work, try going to {bold Forms > Settings > REST API} in the WordPress Dashboard
on our site, and click the Add Key button in the REST API v2 section.

On that page, enter the following:

  Description: {italic TCMA Reporting}
  User:        {italic webmaster}
  Permission:  {italic Read}

Then click {bold Add Key}.
`)

    const {
      GRAVITY_FORMS_CONSUMER_KEY,
      GRAVITY_FORMS_CONSUMER_SECRET,
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'GRAVITY_FORMS_CONSUMER_KEY',
        message: 'Copy and paste Consumer Key from the next page:',
      },
      {
        type: 'input',
        name: 'GRAVITY_FORMS_CONSUMER_SECRET',
        message: 'Copy and paste Consumer Secret from the next page:',
      },
    ])

    await addToDotenv({
      GRAVITY_FORMS_CONSUMER_KEY,
      GRAVITY_FORMS_CONSUMER_SECRET,
    })
  }

  const credentialsFile = path.resolve('google/credentials.json')

  if (!fs.existsSync(credentialsFile)) {
    console.log(chalk`Visit this URL to enable Google Drive access:
    
  https://developers.google.com/drive/api/v3/quickstart/nodejs

Follow the directions to download {bold credentials.json}, and save that file to {bold google/credentials.json}.
`)

    await inquirer.prompt([
      {
        type: 'input',
        name: 'ready',
        message: 'Press enter once you have created google/credentials.json.',
      },
    ])

    if (!fs.existsSync(credentialsFile)) {
      throw new Error(
        `Couldn't find ${credentialsFile}, did you put credentials.json in the right place?`
      )
    }
  }

  await getGoogleAuth()

  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    console.log(`Visit this URL to select a destination folder in Google Drive:
  
  https://drive.google.com

Navigate to the folder you want.
`)
    const { url } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Copy and paste the URL of the page for that folder:',
      },
    ])

    const match = /[a-z0-9]+$/i.exec(url)
    if (!match)
      throw new Error(
        'Expected a URL that looks like this: https://drive.google.com/drive/u/0/folders/ABC123...'
      )

    await addToDotenv({ GOOGLE_DRIVE_FOLDER_ID: match[0] })
  }
}

go().catch((err: Error) => {
  console.error(err.stack) // eslint-disable-line no-console
  process.exit(1)
})
