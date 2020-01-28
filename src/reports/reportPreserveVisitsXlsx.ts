/* eslint-disable no-console */

import {
  SelectField,
  defaultGravityFormsClient,
} from '../util/GravityFormsClient'
import {
  parsePreserveVisitEntry,
  PRESERVE_VISIT_FORM_ID,
  PRESERVE_FIELD_ID,
} from '../forms/PreserveVisitForm'
import getSelectLabels from '../util/getSelectLabels'
import { createPreserveVisitReport } from './PreserveVisitReport'
import slurp from '../util/slurp'
import outputXlsx from '../util/outputXlsx'

export default async function reportPreserveVisitsXlsx({
  file,
  startDate,
  endDate,
}: {
  file: string
  startDate: Date
  endDate: Date
}): Promise<void> {
  const client = defaultGravityFormsClient()

  const form = await client.getForm(PRESERVE_VISIT_FORM_ID)
  const preserveField = form.fields.find(f => f.id === PRESERVE_FIELD_ID)
  if (!preserveField || preserveField.type !== 'select') {
    throw new Error('failed to get preserve names')
  }
  const preserveLabels = getSelectLabels(preserveField as SelectField)

  const entries = (
    await slurp(
      client.entries({
        form_ids: [PRESERVE_VISIT_FORM_ID],
        search: {
          start_date: startDate,
          end_date: endDate,
        },
      })
    )
  ).map(parsePreserveVisitEntry)

  const report = createPreserveVisitReport({
    entries,
    preserveLabels,
    startDate,
    endDate,
  })

  await outputXlsx(report, file)
}
