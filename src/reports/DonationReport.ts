import * as XLSX from 'xlsx'
import { DonationEntry, groupDonationEntries } from '../forms/DonationForm'
import { isEmpty, sum, sumBy, map } from 'lodash'

const total = (entries: DonationEntry[] | undefined): number =>
  entries
    ? sumBy(entries, entry =>
        entry.payment_status === 'Paid' && entry.payment_amount
          ? entry.payment_amount
          : 0
      )
    : 0

const entryRowHeaders = ['Date', 'First Name', 'Last Name', 'Amount']
const entryRow = (entry: DonationEntry): any[] => [
  entry.payment_date,
  entry.name.first,
  entry.name.last,
  entry.payment_amount,
]

function addGroup(
  data: any[][],
  title: string,
  entries: DonationEntry[]
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

export function createDonationReport(options: {
  entries: DonationEntry[]
  preserveLabels: Record<string, string>
  startDate: Date
  endDate: Date
}): XLSX.WorkBook {
  const { entries, preserveLabels, startDate, endDate } = options
  const grouped = groupDonationEntries(entries)

  const workbook = XLSX.utils.book_new()

  const data: any[][] = []

  data.push(['Donations'])
  data.push(['Start Date:', startDate])
  data.push(['End Date:', endDate])
  data.push([])
  data.push(['PRESERVES', sum(map(grouped.preserve, total))])
  for (const [preserve, label] of Object.entries(preserveLabels)) {
    data.push([label, total(grouped.preserve[preserve])])
  }
  data.push(['HONORING', sum(map(grouped.honoring, total))])
  for (const [honoring, entries] of Object.entries(grouped.honoring)) {
    data.push([honoring, total(entries)])
  }
  data.push(['CAUSES', sum(map(grouped.cause, total))])
  for (const [cause, entries] of Object.entries(grouped.cause)) {
    data.push([cause, total(entries)])
  }
  data.push(['OTHER', total(grouped.other)])
  data.push(['TOTAL', total(entries)])

  data.push([])
  data.push(['PRESERVES'])
  data.push([])
  for (const [preserve, entries] of Object.entries(grouped.preserve)) {
    addGroup(data, preserveLabels[preserve], entries)
  }

  if (!isEmpty(grouped.honoring)) {
    data.push([])
    data.push(['HONORING'])
    data.push([])
    for (const [honoring, entries] of Object.entries(grouped.honoring)) {
      addGroup(data, honoring, entries)
    }
  }

  if (!isEmpty(grouped.cause)) {
    data.push([])
    data.push(['CAUSES'])
    data.push([])
    for (const [cause, entries] of Object.entries(grouped.cause)) {
      addGroup(data, cause, entries)
    }
  }

  if (grouped.other.length) {
    data.push([])
    addGroup(data, 'OTHER', grouped.other)
  }

  const sheet = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, sheet)

  return workbook
}
