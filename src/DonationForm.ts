import { Entry } from './GravityFormsClient'
import { omitBy } from 'lodash'

export const DONATION_FORM_ID = '3'

interface DonationEntry extends Entry {
  name: {
    prefix: string | null
    first: string | null
    middle: string | null
    last: string | null
    suffix: string | null
  }
  email: string | null
  address: {
    street: string | null
    line2: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
  }
  phone: string | null
  donation: number | null
  fund: 'general' | 'preserve' | 'memorial' | 'other' | null
  card: {
    number: string
    type: string
  }
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
    donation: raw['7'] ? parseFloat(raw['7']) : null,
    fund: raw['8'] || null,
    card: {
      number: raw['11.1'] || null,
      type: raw['11.4'] || null,
    },
    preserve: raw['12'] || null,
    honoring: raw['14'] || null,
    donationType: raw['20'] || null,
    cause: raw['21'] || null,
    monthlyDonation: raw['25'] ? parseFloat(raw['25']) : null,
  }
}
