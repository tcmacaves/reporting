import { Entry } from '../util/GravityFormsClient'
import { AddressFields, NameFields, CardFields } from './CommonFields'
import { omitBy } from 'lodash'
import { groupBy } from 'lodash/fp'

export const PRESERVE_VISIT_FORM_ID = 9
export const PRESERVE_FIELD_ID = 3

export interface PreserveVisitEntry extends Entry {
  preserve: string | null
  tripDate: Date | null
  registrantName: NameFields
  email: string | null
  registrantIsMinor: boolean
  ageOfMinor: number | null
  guardianName: NameFields
  signature: any
  address: AddressFields
  phone: string | null
  donation: number | null
  card: CardFields
}

export function parsePreserveVisitEntry(entry: Entry): PreserveVisitEntry {
  const raw = entry as any // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    ...(omitBy(entry, (value, key) => /^\d+(\.\d+)*$/.test(key)) as Entry),
    preserve: raw['3'] || null,
    tripDate: raw['4'] ? new Date(raw['4']) : null,
    registrantName: {
      prefix: raw['5.2'] || null,
      first: raw['5.3'] || null,
      middle: raw['5.4'] || null,
      last: raw['5.6'] || null,
      suffix: raw['5.8'] || null,
    },
    registrantIsMinor: raw['15'] === 'minor',
    ageOfMinor: raw['19'] ? parseInt(raw['19']) : null,
    guardianName: {
      prefix: raw['17.2'] || null,
      first: raw['17.3'] || null,
      middle: raw['17.4'] || null,
      last: raw['17.6'] || null,
      suffix: raw['17.8'] || null,
    },
    signature: raw['24'],
    email: raw['7'] || null,
    address: {
      street: raw['6.1'] || null,
      line2: raw['6.2'] || null,
      city: raw['6.3'] || null,
      state: raw['6.4'] || null,
      zip: raw['6.5'] || null,
      country: raw['6.6'] || null,
    },
    phone: raw['8'] || null,
    donation: raw['20']
      ? parseFloat(raw['20'].replace('$', ''))
      : raw['23']
      ? parseFloat(raw['23'].replace('$', ''))
      : null,
    card: {
      number: raw['14.1'] || null,
      type: raw['14.4'] || null,
    },
  }
}

export const groupPreserveVisitEntries: (
  entries: PreserveVisitEntry[]
) => Record<string, PreserveVisitEntry[]> = groupBy('preserve') as any
