# @tcmacaves/reporting

## Setup

You'll need to install [Node.js](https://nodejs.org/) and be familiar
with the command line to run these scripts.

After cloning this repository into a directory, run `npm install` in the
directory to install code this project needs.

The scripts won't work until you tell them how to securely fetch data from
Gravity Forms on our WordPress.

Do this by going to **Forms > Settings > REST API** in the WordPress Dashboard on our site, and click the **Add Key** button in the REST API v2 section (Or try [This Link](https://www.tcmacaves.org/wp-admin/admin.php?page=gf_settings&subview=gravityformswebapi&action=edit&key_id=0))

In the form that comes up, enter the following values, and then click **Add Key**.

![Add Key Form](</img/Add Key Form.png>)

On the next page, copy the gibbersh text in the **Consumer Key** and **Consumer Secret** text fields, and save them in the following format
into a `.env` file in the directory you cloned this project into:

```
GF_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxx
GF_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxx
```

Now you should be able to run the scripts.

## Scripts

Right now there's just one script to generate a report of donations for the
previous month. Run it with the following command in the project directory:

```
npm run start
```

It will take at least 10 seconds as it fetches data from our server.
Once it's done it will say `Wrote TCMA Donations Jan 2020.xlsx`
(or whatever date).
