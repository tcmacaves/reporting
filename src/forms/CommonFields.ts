export type NameFields = {
  prefix: string | null
  first: string | null
  middle: string | null
  last: string | null
  suffix: string | null
}

export type AddressFields = {
  street: string | null
  line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export type CardFields = {
  number: string
  type: string
}
