import 'dotenv/config'
import reportDonationsXlsx from './reports/reportDonationsXlsx'
import reportPreserveVisitsXlsx from './reports/reportPreserveVisitsXlsx'
import getYearDateRange from './util/getYearDateRange'
import getMonthDateRange from './util/getMonthDateRange'

export async function handler({
  report,
  year,
  month,
}: {
  report: 'donations' | 'preserveVisits'
  year: number | 'previous'
  month?: number | 'previous' | null | undefined
}): Promise<void> {
  let startDate, endDate
  if (month === 'previous') {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    ;[startDate, endDate] = getMonthDateRange(
      lastMonth.getFullYear(),
      lastMonth.getMonth()
    )
  } else if (year === 'previous') {
    const lastYear = new Date()
    lastYear.setFullYear(
      process.argv[2] ? parseInt(process.argv[2]) : lastYear.getFullYear() - 1,
      0,
      1
    )
    ;[startDate, endDate] = getYearDateRange(lastYear.getFullYear())
  } else {
    if (month != null) {
      ;[startDate, endDate] = getMonthDateRange(year, month - 1)
    } else {
      ;[startDate, endDate] = getYearDateRange(year)
    }
  }

  const dateStr: string =
    month != null
      ? startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        })
      : String(startDate.getFullYear())

  switch (report) {
    case 'donations':
      await reportDonationsXlsx({
        file: `TCMA Donations ${dateStr}.xlsx`,
        startDate,
        endDate,
      })
      return
    case 'preserveVisits':
      await reportPreserveVisitsXlsx({
        file: `TCMA Preserve Visits ${dateStr}.xlsx`,
        startDate,
        endDate,
      })
      return
    default:
      throw new Error(`invalid report name: ${report}`)
  }
}

if (!module.parent) {
  handler(JSON.parse(process.argv[2])).catch(error => {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  })
}
