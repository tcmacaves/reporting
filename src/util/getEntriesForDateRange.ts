import GravityFormsClient, { EntriesOptions, Entry } from './GravityFormsClient'

export interface EntriesForDateRangeOptions extends EntriesOptions {
  startDate: Date
  endDate: Date
}

export default async function getEntriesForDateRange(
  client: GravityFormsClient,
  { startDate, endDate, ...options }: EntriesForDateRangeOptions
): Promise<Entry[]> {
  const entries: Entry[] = []

  for await (const entry of client.entries({
    ...options,
    sorting: {
      key: 'date_created',
      direction: 'DESC',
    },
  })) {
    if (entry.date_created >= endDate) continue
    if (entry.date_created < startDate) break
    entries.push(entry)
  }
  return entries
}
