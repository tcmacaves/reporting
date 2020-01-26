export default function getYearDateRange(fullYear: number): [Date, Date] {
  const start = new Date()
  start.setFullYear(fullYear, 0, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setFullYear(fullYear + 1, 0, 1)
  end.setHours(0, 0, 0, 0)

  return [start, end]
}
