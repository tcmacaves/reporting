/**
 * @prettier
 * @flow
 */

export default async function slurp<T>(
  iterable: AsyncIterable<T>
): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
  }
  return items
}
