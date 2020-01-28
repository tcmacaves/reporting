import XLSX from 'xlsx'

import { google } from 'googleapis'
import { getGoogleAuth } from './google'
import { getConfig } from '../config'
import { PassThrough } from 'stream'
import { XLSX_MIME_TYPE } from '../config/mimeTypes'

export default async function outputXlsx(
  workbook: XLSX.WorkBook,
  file: string
): Promise<void> {
  if (process.env.WRITE_LOCAL_FILE) {
    XLSX.writeFile(workbook, file)
    console.error(`Wrote ${file}`) // eslint-disable-line no-console
  } else {
    const drive = google.drive({ version: 'v3', auth: await getGoogleAuth() })
    const { GOOGLE_DRIVE_FOLDER_ID } = getConfig()

    const bufferStream = new PassThrough()
    bufferStream.end(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
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
}
