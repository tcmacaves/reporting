/* eslint-disable no-console */

import * as dotenv from 'dotenv'
import GravityFormsClient, { SelectField } from './GravityFormsClient'
import {
  parseDonationEntry,
  DONATION_FORM_ID,
  PRESERVE_FIELD_ID,
} from './DonationForm'
import requireEnv from '@jcoreio/require-env'
import getSelectLabels from './util/getSelectLabels'
import { createDonationReport } from './reports/DonationReport'
import * as XLSX from 'xlsx'
import getMonthDateRange from './util/getMonthDateRange'
import getEntriesForDateRange from './util/getEntriesForDateRange'

dotenv.config()

async function go(): Promise<void> {
  const client = new GravityFormsClient({
    baseUrl: requireEnv('SITE_BASE_URL'),
    consumerKey: requireEnv('GF_CONSUMER_KEY'),
    consumerSecret: requireEnv('GF_CONSUMER_SECRET'),
  })

  const form = await client.getForm(DONATION_FORM_ID)
  const preserveField = form.fields.find(f => f.id === PRESERVE_FIELD_ID)
  if (!preserveField || preserveField.type !== 'select') {
    throw new Error('failed to get preserve names')
  }
  const preserveLabels = getSelectLabels(preserveField as SelectField)

  const date = new Date()
  date.setMonth(date.getMonth() - 1)

  const [startDate, endDate] = getMonthDateRange(
    date.getFullYear(),
    date.getMonth()
  )

  const entries = (
    await getEntriesForDateRange(client, {
      form_ids: [DONATION_FORM_ID],
      startDate,
      endDate,
    })
  ).map(parseDonationEntry)

  const report = createDonationReport({
    entries,
    preserveLabels,
    startDate,
    endDate,
  })

  XLSX.writeFile(report, 'donations.xlsx')
  console.log('wrote donations.xlsx') // eslint-disable-line no-console
}

go().then(console.log, console.error)
