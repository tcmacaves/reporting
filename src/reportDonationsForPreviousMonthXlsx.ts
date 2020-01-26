import 'dotenv/config'
import reportDonationsXlsx from './reports/reportDonationsXlsx'
import getMonthDateRange from './util/getMonthDateRange'

export async function handler(): Promise<void> {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const [startDate, endDate] = getMonthDateRange(
    lastMonth.getFullYear(),
    lastMonth.getMonth()
  )

  await reportDonationsXlsx({
    file: `TCMA Donations ${startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })}.xlsx`,
    startDate,
    endDate,
  })
}

if (!module.parent) {
  handler().catch(error => {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  })
}
