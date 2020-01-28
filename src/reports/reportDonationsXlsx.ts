/* eslint-disable no-console */

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
import { PassThrough } from 'stream'
import { google } from 'googleapis'
import { getConfig } from '../config'
import { XLSX_MIME_TYPE } from '../config/mimeTypes'
import { getGoogleAuth } from '../util/google'
import slurp from '../util/slurp'

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
    await slurp(
      client.entries({
        form_ids: [DONATION_FORM_ID],
        search: {
          start_date: startDate,
          end_date: endDate,
        },
      })
    )
  ).map(parseDonationEntry)

  const report = createDonationReport({
    entries,
    preserveLabels,
    startDate,
    endDate,
  })

  const drive = google.drive({ version: 'v3', auth: await getGoogleAuth() })
  const { GOOGLE_DRIVE_FOLDER_ID } = getConfig()

  const bufferStream = new PassThrough()
  bufferStream.end(XLSX.write(report, { type: 'buffer', bookType: 'xlsx' }))
  await drive.files.create({
    requestBody: {
      name: file,
      mimeType: XLSX_MIME_TYPE,
      parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : null,
    },
    media: {
      mimeType: XLSX_MIME_TYPE,
      body: bufferStream,
    },
  })
  console.error(`Created ${file} in Google Drive`) // eslint-disable-line no-console
}
