import * as fs from 'fs-extra'
import inquirer from 'inquirer'
import { google } from 'googleapis'
import { once } from 'lodash'
import { Credentials } from 'google-auth-library'

const SCOPES = ['https://www.googleapis.com/auth/drive']
const TOKEN_PATH = 'google/token.json'

export const getGoogleAuth = once(async () => {
  const credentials = await fs.readJson('google/credentials.json')

  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  async function getAccessToken(): Promise<Credentials> {
    if (process.env.LAMBDA) {
      throw new Error(
        'You must get the access token before deploying to Lambda'
      )
    }

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    })
    /* eslint-disable no-console */
    console.log(`Authorize Google API access by visiting this url:
  
  ${authUrl}
`)
    /* eslint-enable no-console */
    const { code } = await inquirer.prompt([
      {
        type: 'input',
        name: 'code',
        message: 'Enter the code from that page here',
      },
    ])
    const { tokens } = await oAuth2Client.getToken(code)
    await fs.writeJson(TOKEN_PATH, tokens)
    return tokens
  }

  const token = await fs.readJson(TOKEN_PATH).catch(getAccessToken)
  oAuth2Client.setCredentials(token)
  return oAuth2Client
})

if (!module.parent) {
  getGoogleAuth()
}
