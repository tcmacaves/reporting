import { SelectField } from './GravityFormsClient'

export default function getSelectLabels(
  field: SelectField
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const { value, text } of field.choices) {
    result[value] = text
  }
  return result
}
