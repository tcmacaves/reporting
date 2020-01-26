import reportDonationsXlsx from '../reports/reportDonationsXlsx'
import getMonthDateRange from '../util/getMonthDateRange'

async function go(): Promise<void> {
  const now = new Date()
  const [startDate, endDate] = getMonthDateRange(
    now.getFullYear(),
    now.getMonth()
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

go().catch(error => {
  console.error(error.stack) // eslint-disable-line no-console
  process.exit(1)
})
