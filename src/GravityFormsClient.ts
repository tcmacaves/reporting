import { pick } from 'lodash/fp'
import request from 'request-promise'

type Options = {
  baseUrl: string
  apiPath?: string
  consumerKey: string
  consumerSecret: string
}

type EntryStatus = 'active' | 'spam' | 'trash'

type EntriesOptions = {
  _field_ids?: string[]
  _labels?: boolean
  form_ids?: string[]
  include?: string[]
  paging?: {
    page_size?: number
    current_page?: number
    offset?: number
  }
  search?: {
    status?: EntryStatus
    mode?: 'all' | 'any'
    field_filters?: Array<{
      key: string
      value: string
      operator:
        | 'is'
        | '='
        | 'contains'
        | 'like'
        | 'is not'
        | 'isnot'
        | '<>'
        | 'not in'
        | 'in'
    }>
  }
  sorting?: {
    key?: string
    direction?: 'ASC' | 'DESC' | 'RAND'
    is_numeric?: boolean
  }
}

type RawEntry = {
  id: string
  form_id: string
  post_id: string | null
  date_created: string
  date_updated: string | null
  is_starred: string
  is_read: string
  ip: string
  source_url: string
  user_agent: string
  currency: string
  payment_status: string
  payment_date: string | null
  payment_amount: string
  payment_method: string
  is_fulfilled: string | null
  transaction_type: string | null
  status: EntryStatus
}

export interface Entry {
  id: string
  form_id: string
  post_id: string | null
  date_created: Date
  date_updated: Date | null
  is_starred: boolean
  is_read: boolean
  ip: string
  source_url: string
  user_agent: string
  currency: string
  payment_status: string
  payment_date: Date | null
  payment_amount: number | null
  payment_method: string
  is_fulfilled: boolean
  transaction_type: string | null
  status: EntryStatus
}

type Entries = Entry[]

export function parseEntry({
  id,
  form_id,
  post_id,
  date_created,
  date_updated,
  is_starred,
  is_read,
  ip,
  source_url,
  user_agent,
  currency,
  payment_status,
  payment_date,
  payment_amount,
  payment_method,
  is_fulfilled,
  transaction_type,
  status,
  ...rest
}: RawEntry): Entry {
  return {
    ...rest,
    id,
    form_id,
    post_id,
    date_created: new Date(date_created),
    date_updated: date_updated ? new Date(date_updated) : null,
    is_starred: is_starred === '1',
    is_read: is_read === '1',
    ip,
    source_url,
    user_agent,
    currency,
    payment_status,
    payment_date: payment_date ? new Date(payment_date) : null,
    payment_amount: payment_amount ? parseFloat(payment_amount) : null,
    payment_method,
    is_fulfilled: is_fulfilled === '1',
    transaction_type,
    status,
  }
}

export default class GravityFormsClient {
  private readonly baseUrl: string
  private readonly Authorization: string

  constructor({
    consumerKey,
    consumerSecret,
    baseUrl,
    apiPath = '/wp-json/gf/v2',
  }: Options) {
    this.baseUrl = baseUrl + apiPath
    this.Authorization = `Basic ${Buffer.from(
      `${consumerKey}:${consumerSecret}`,
      'utf8'
    ).toString('base64')}`
  }

  async entries(options: EntriesOptions): Promise<Entries> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const query: Record<string, any> = pick([
      /* eslint-enable @typescript-eslint/no-explicit-any */
      'form_ids',
      'include',
      'paging',
      'search',
      'sorting',
    ])(options)
    if (options._field_ids) query._field_ids = options._field_ids.join(',')
    if (options._labels) query._labels = '1'

    const { Authorization, baseUrl } = this

    const { entries } = await request({
      uri: `${baseUrl}/entries`,
      qs: query,
      headers: { Authorization },
      json: true,
    })
    return entries.map(parseEntry)
  }
}
