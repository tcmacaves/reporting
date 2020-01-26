/* eslint-disable no-console */

import * as dotenv from 'dotenv'
import {
  SelectField,
  defaultGravityFormsClient,
} from '../util/GravityFormsClient'
import {
  parseDonationEntry,
  DONATION_FORM_ID,
  PRESERVE_FIELD_ID,
} from '../forms/DonationForm'
import getSelectLabels from '../util/getSelectLabels'
import { createDonationReport } from './DonationReport'
import * as XLSX from 'xlsx'
import getEntriesForDateRange from '../util/getEntriesForDateRange'

dotenv.config()

export default async function reportDonationsXlsx({
  file,
  startDate,
  endDate,
}: {
  file: string
  startDate: Date
  endDate: Date
}): Promise<void> {
  const client = defaultGravityFormsClient()

  const form = await client.getForm(DONATION_FORM_ID)
  const preserveField = form.fields.find(f => f.id === PRESERVE_FIELD_ID)
  if (!preserveField || preserveField.type !== 'select') {
    throw new Error('failed to get preserve names')
  }
  const preserveLabels = getSelectLabels(preserveField as SelectField)

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

  XLSX.writeFile(report, file)
  console.error(`Wrote ${file}`) // eslint-disable-line no-console
}
