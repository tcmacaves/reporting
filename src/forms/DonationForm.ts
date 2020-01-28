import { Entry } from '../util/GravityFormsClient'
import { omitBy, mapKeys } from 'lodash'
import { NameFields, AddressFields, CardFields } from './CommonFields'

export const DONATION_FORM_ID = 3
export const PRESERVE_FIELD_ID = 12
export const FUND_FIELD_ID = 8

export interface DonationEntry extends Entry {
  name: NameFields
  email: string | null
  address: AddressFields
  phone: string | null
  donation: number | null
  fund: 'general' | 'preserve' | 'memorial' | 'other' | null
  card: CardFields
  preserve: string | null
  honoring: string | null
  cause: string | null
  donationType: 'sustaining' | 'single' | null
  monthlyDonation: number | null
}

export function parseDonationEntry(entry: Entry): DonationEntry {
  const raw = entry as any // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    ...(omitBy(entry, (value, key) => /^\d+(\.\d+)*$/.test(key)) as Entry),
    name: {
      prefix: raw['1.2'] || null,
      first: raw['1.3'] || null,
      middle: raw['1.4'] || null,
      last: raw['1.6'] || null,
      suffix: raw['1.8'] || null,
    },
    email: raw['2'] || null,
    address: {
      street: raw['5.1'] || null,
      line2: raw['5.2'] || null,
      city: raw['5.3'] || null,
      state: raw['5.4'] || null,
      zip: raw['5.5'] || null,
      country: raw['5.6'] || null,
    },
    phone: raw['6'] || null,
    donation: raw['7'] ? parseFloat(raw['7'].replace('$', '')) : null,
    fund: raw['8'] || null,
    card: {
      number: raw['11.1'] || null,
      type: raw['11.4'] || null,
    },
    preserve: raw['12'] || null,
    honoring: raw['14'] || null,
    donationType: raw['20'] || null,
    cause: raw['21'] || null,
    monthlyDonation: raw['25'] ? parseFloat(raw['25'].replace('$', '')) : null,
  }
}

export type GroupedDonationEntries = {
  preserve: Record<string, DonationEntry[]>
  honoring: Record<string, DonationEntry[]>
  cause: Record<string, DonationEntry[]>
  other: DonationEntry[]
}

export function groupDonationEntries(
  entries: DonationEntry[]
): GroupedDonationEntries {
  const grouped: GroupedDonationEntries = {
    preserve: {},
    honoring: {},
    cause: {},
    other: [],
  }

  function push(
    map: Record<string, DonationEntry[]>,
    key: string,
    entry: DonationEntry
  ): void {
    let entries =
      map[
        key
          .trim()
          .toLowerCase()
          .replace(/\s+/, ' ')
      ]
    if (!entries) {
      map[key] = entries = []
    }
    entries.push(entry)
  }

  for (const entry of entries) {
    const { preserve, honoring, cause } = entry
    if (preserve) push(grouped.preserve, preserve, entry)
    else if (honoring) push(grouped.honoring, honoring, entry)
    else if (cause) push(grouped.cause, cause, entry)
    else grouped.other.push(entry)
  }

  grouped.honoring = mapKeys(grouped.honoring, ([entry]) => entry.honoring)
  grouped.cause = mapKeys(grouped.cause, ([entry]) => entry.cause)

  return grouped
}
