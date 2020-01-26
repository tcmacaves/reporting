# @tcmacaves/reporting

## Setup

You'll need to install [Node.js](https://nodejs.org/), [Yarn](https://yarnpkg.com),
and be familiar with the command line to run these scripts.

After cloning this repository into a directory, run `yarn` in the
directory to install code this project needs.

Then run `yarn setup`. The setup script will guide you through the rest of the process.

You can configure Amazon Web Services to run the reporting scripts automatically each
month; see the `yarn deploy` script below for information.

## Scripts

### `yarn monthly-donations`

Creates a monthly donation report and uploads it to Google Drive.
Once it's finished, it outputs something like Created TCMA Donations Jan 2020.xlsx.
It make take a moment to fetch the donations from our site.

### `yarn annual-donations`

Creates a annual donation report and uploads it to Google Drive.
Once it's finished, it outputs something like Created TCMA Donations 2020.xlsx.
It make take awhile to fetch the donations from our site.

### `yarn deploy`

Deploys a Lambda function to Amazon Web Services and schedules it to generate the
donation report on the first day of each month.
You must have an AWS account setup and AWS credentials stored in your
home directory to run this script.
