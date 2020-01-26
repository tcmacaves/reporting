/* eslint-disable no-console */

import * as dotenv from 'dotenv'
import GravityFormsClient from './GravityFormsClient'
import { parseDonationEntry, DONATION_FORM_ID } from './DonationForm'
import requireEnv from '@jcoreio/require-env'

dotenv.config()

async function go(): Promise<void> {
  const client = new GravityFormsClient({
    baseUrl: requireEnv('SITE_BASE_URL'),
    consumerKey: requireEnv('GF_CONSUMER_KEY'),
    consumerSecret: requireEnv('GF_CONSUMER_SECRET'),
  })
  console.log(
    JSON.stringify(
      (
        await client.entries({
          form_ids: [DONATION_FORM_ID],
          paging: {
            page_size: 50,
          },
          sorting: {
            key: 'date_created',
            direction: 'DESC',
          },
        })
      ).map(parseDonationEntry),
      null,
      2
    )
  )
}

go().then(console.log, console.error)
