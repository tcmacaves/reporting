import * as XLSX from 'xlsx'
import {
  PreserveVisitEntry,
  groupPreserveVisitEntries,
} from '../forms/PreserveVisitForm'
import { sumBy } from 'lodash'

const total = (entries: PreserveVisitEntry[] | undefined): number =>
  entries
    ? sumBy(entries, entry =>
        entry.payment_status === 'Paid' && entry.payment_amount
          ? entry.payment_amount
          : 0
      )
    : 0

const entryRowHeaders = ['Date', 'First Name', 'Last Name', 'Amount']
const entryRow = (entry: PreserveVisitEntry): any[] => [
  entry.tripDate,
  entry.registrantName.first,
  entry.registrantName.last,
  entry.payment_amount,
]

function addGroup(
  data: any[][],
  title: string,
  entries: PreserveVisitEntry[]
): void {
  data.push([])
  const header: Array<string | number | null> = [title]
  while (header.length < entryRowHeaders.length) header.push(null)
  header[entryRowHeaders.length - 1] = total(entries)
  data.push(header)
  data.push(entryRowHeaders)
  for (const entry of entries) {
    data.push(entryRow(entry))
  }
}

export function createPreserveVisitReport(options: {
  entries: PreserveVisitEntry[]
  preserveLabels: Record<string, string>
  startDate: Date
  endDate: Date
}): XLSX.WorkBook {
  const { entries, preserveLabels, startDate, endDate } = options
  const grouped = groupPreserveVisitEntries(entries)

  const workbook = XLSX.utils.book_new()

  const data: any[][] = []

  data.push(['Preserve Visits'])
  data.push(['Start Date:', startDate])
  data.push(['End Date:', endDate])
  data.push([])
  for (const [preserve, label] of Object.entries(preserveLabels)) {
    data.push([label, total(grouped[preserve])])
  }
  data.push(['TOTAL', total(entries)])

  data.push([])
  for (const [preserve, entries] of Object.entries(grouped)) {
    addGroup(data, preserveLabels[preserve], entries)
  }

  const sheet = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, sheet)

  return workbook
}
