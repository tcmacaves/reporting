import { pick, once } from 'lodash/fp'
import request from 'request-promise'
import { SITE_BASE_URL } from './constants'
import requireEnv from '@jcoreio/require-env'

type Options = {
  baseUrl: string
  apiPath?: string
  consumerKey: string
  consumerSecret: string
}

type EntryStatus = 'active' | 'spam' | 'trash'

type Paging = {
  page_size?: number
  current_page?: number
  offset?: number
}

export interface EntriesOptions {
  _field_ids?: string[]
  _labels?: boolean
  form_ids?: Array<string | number>
  include?: string[]
  paging?: Paging
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

export interface Input {
  id: string
  label: string
  name: string
}

export interface Choice {
  text: string
  value: string
  isSelected: boolean
  price: string
}

export interface BaseField {
  type: string
  id: number
  label: string
  adminLabel: string
  isRequired: boolean
  size: string
  errorMessage: string
  visibility: 'visible' | 'hidden'
  inputs: Input[] | null
  formId: number
  description: string
  allowsPrepopulate: boolean
  inputMask: boolean
  inputMaskValue: string
  inputType: string
  labelPlacement: string
  descriptionPlacement: string
  subLabelPlacement: string
  placeholder: string
  cssClass: string
  inputName: string
  noDuplicates: boolean
  defaultValue: string
  conditionalLogic: string
  productField: string
  enablePasswordInput: string
  maxLength: string
  multipleFiles: boolean
  maxFiles: string
  calculationFormula: string
  calculationRounding: string
  enableCalculation: string
  disableQuantity: boolean
  displayAllCategories: boolean
  useRichTextEditor: boolean
  pageNumber: number
  fields: string
}

export interface SelectField extends BaseField {
  type: 'select'
  id: number
  choices: Choice[]
}

export type Field = SelectField | BaseField

export interface Notification {
  id: string
  to: string
  name: string
  event: string
  toType: string
  subject: string
  message: string
}

export interface Confirmation {
  id: string
  name: string
  isDefault: boolean
  type: string
  message: string
  url: string
  pageId: string
  queryString: string
}

export interface RawForm {
  title: string
  description: string
  labelPlacement: string
  descriptionPlacement: string
  button: {
    type: string
    text: string
    imageUrl: string
  }
  fields: Field[]
  version: string
  id: number
  useCurrentUserAsAuthor: boolean
  postContentTemplateEnabled: boolean
  postTitleTemplateEnabled: boolean
  postTitleTemplate: string
  postContentTemplate: string
  lastPageButton: string
  pagination: string | null
  firstPageCssClass: string | null
  nextFieldId: number
  notifications: Record<string, Notification>
  confirmations: Record<string, Confirmation>
  is_active: string
  date_created: string
  is_trash: string
}

export interface Form {
  title: string
  description: string
  labelPlacement: string
  descriptionPlacement: string
  button: {
    type: string
    text: string
    imageUrl: string
  }
  fields: Field[]
  version: string
  id: number
  useCurrentUserAsAuthor: boolean
  postContentTemplateEnabled: boolean
  postTitleTemplateEnabled: boolean
  postTitleTemplate: string
  postContentTemplate: string
  lastPageButton: string
  pagination: string | null
  firstPageCssClass: string | null
  nextFieldId: number
  notifications: Record<string, Notification>
  confirmations: Record<string, Confirmation>
  is_active: boolean
  date_created: Date
  is_trash: boolean
}

export function parseForm({
  is_active,
  date_created,
  is_trash,
  ...rest
}: RawForm): Form {
  return {
    ...rest,
    is_active: is_active === '1',
    date_created: new Date(date_created),
    is_trash: is_trash === '1',
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

  async entriesPage(options: EntriesOptions): Promise<Entries> {
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

  async *entries(_options: EntriesOptions): AsyncIterable<Entry> {
    const paging: Paging = { ..._options.paging }
    const options = { ..._options, paging }
    let entries
    do {
      entries = await this.entriesPage(options)
      yield* entries
      if (paging.current_page != null) paging.current_page++
      else paging.offset = (paging.offset || 0) + entries.length
    } while (entries.length)
  }

  async getForm(id: number): Promise<Form> {
    const { Authorization, baseUrl } = this

    const raw = await request({
      uri: `${baseUrl}/forms/${id}`,
      headers: { Authorization },
      json: true,
    })
    return parseForm(raw)
  }
}

export const defaultGravityFormsClient = once(
  (): GravityFormsClient =>
    new GravityFormsClient({
      baseUrl: SITE_BASE_URL,
      consumerKey: requireEnv('GF_CONSUMER_KEY'),
      consumerSecret: requireEnv('GF_CONSUMER_SECRET'),
    })
)
