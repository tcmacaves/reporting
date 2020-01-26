export default function getMonthDateRange(
  fullYear: number,
  month: number
): [Date, Date] {
  const start = new Date()
  start.setFullYear(fullYear, month, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setMonth(start.getMonth() + 1)

  return [start, end]
}
