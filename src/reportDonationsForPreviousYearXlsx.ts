import reportDonationsXlsx from './reports/reportDonationsXlsx'
import getYearDateRange from './util/getYearDateRange'

async function go(): Promise<void> {
  const lastYear = new Date()
  lastYear.setFullYear(
    process.argv[2] ? parseInt(process.argv[2]) : lastYear.getFullYear() - 1,
    0,
    1
  )
  const [startDate, endDate] = getYearDateRange(lastYear.getFullYear())

  await reportDonationsXlsx({
    file: `TCMA Donations ${startDate.getFullYear()}.xlsx`,
    startDate,
    endDate,
  })
}

go().catch(error => {
  console.error(error.stack) // eslint-disable-line no-console
  process.exit(1)
})
