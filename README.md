# Ajanta Paver – Billing App

Quotation → Proforma Invoice → Tax Invoice → Delivery Note → Payment Receipt,
Purchase Order → Purchase Entry → Payment Voucher, customer/vendor ledgers and CA export.
Plain HTML/JS, no installation needed. Hosted free on **GitHub Pages**, data in **Supabase**.

## Files
| File | What it is |
|---|---|
| `index.html` | The app |
| `css/app.css`, `js/app.js` | Design and logic |
| `js/config.js` | **Your Supabase URL + key go here** |
| `assets/logo.png`, `assets/signature.png` | Logo and signature (can also be changed in Settings) |
| `supabase/schema.sql` | Database setup – run once in Supabase |

## Step 1 – Supabase (database + login)
1. Open your Supabase project → **SQL Editor → New query**.
2. Open `supabase/schema.sql`, change the e-mail in the `app_members` insert to the e-mail(s) that will log in
   (yours and your father's), paste the whole file and click **Run**.
3. **Authentication → Users → Add user → Create new user**: enter the same e-mail + a password, tick *Auto confirm*.
4. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up" (so nobody else can register).
5. **Project Settings → API**: copy the **Project URL** and the **anon / publishable key**.

To add another person later: add their e-mail to `app_members` (Table Editor) and create the user in Authentication.

## Step 2 – Connect the app
Open `js/config.js` and paste the two values:
```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...'
};
```
The anon key is meant to be public; your data is protected by the login and the `app_members` list.
(If you leave these empty the app runs in **demo mode** and saves only in that browser – handy for trying it out.)

## Step 3 – Publish on GitHub Pages (all in the browser, nothing to install)
1. github.com → **New repository** (e.g. `ajanta-billing`), Public, create.
2. **Add file → Upload files** → drag in everything from this folder (keep the `css`, `js`, `assets`, `supabase` folders) → **Commit**.
3. Repository **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. After about a minute the app is live at `https://<your-username>.github.io/ajanta-billing/`.
   On a phone, open it and use **Add to Home Screen**.

## How the flow works
- **Quotation** → buttons at the bottom: *Make Tax Invoice*, *Make Proforma Invoice*
- **Proforma Invoice** → *Make Tax Invoice*
- **Tax Invoice** → *Make Delivery Note*, *Make Payment Receipt* (amount = balance due)
- **Purchase Order** → *Make Purchase Entry* (items copied; add vendor bill no., freight/other charges, attach bill photo/PDF)
- **Purchase Entry** → *Make Payment Voucher*
- **Ledger**: Invoices debit the customer, receipts credit; purchase entries credit the vendor, payments debit.
  Opening balances can be set per party. A party can be Customer, Vendor or both (tags shown).
- **CA Export** (dashboard): choose dates separately for Sales and Purchases →
  - Sales PDF = sales register + every tax invoice + every customer ledger for that period
  - Purchase PDF = purchase register + every purchase entry with its attached bills + every vendor ledger
  - Register (CSV) opens in Excel for GST filing.
- **Print / PDF** on any document → choose *Save as PDF* in the print dialog.
- **Settings**: company details, bank details, default terms, numbering (continues from INV-21, Quote-11 etc.), logo/signature, backup.

## Terms & conditions
- Dashboard → **Terms & Conditions**: add as many as you like (title + content). Two separate lists:
  *Quotation / PI / Invoice* and *Purchase Order*. Tick "auto-add" to put a term on every new document.
- While making a document, use the **＋ Add terms & conditions…** dropdown. Pick a saved term (pick it again to add it again),
  "Add all saved terms", or **✚ Add new terms…** to write a new one (it is saved to your list too).
- Terms on a document can be edited, reordered or removed without changing your saved list.

## Customising
Settings → company details, bank details, logo/signature, **Document design** (title of each document,
HSN column, signature, bank details, amount in words, state name, table colour, text colour and size, with a live preview),
**Lists & defaults** (units, payment methods, charge names, GST rates, default unit and GST), default texts and numbering.
Any saved document can be edited at any time, including its number; linked receipts/payments are updated automatically.
When editing a customer/vendor you can tick "Also update these details on all existing documents".

## Import from Excel / CSV
Settings → **Import from Excel / CSV** (customers & vendors, products, or terms). Download the template or use your own file;
common column names (Company Name, Mobile, GST No, Price, Tax (in %), UOM, HSN Code…) are recognised.
You see a preview (new / update / skipped) before anything is saved. Existing records are matched by GSTIN or name.

## Export / Backup (ZIP)
Dashboard → **Export / Backup** → one ZIP with every document as a PDF in folders
(Quotations, PIs, Invoices, Delivery Notes, Receipts, POs, Purchases + attached bills, Payment Vouchers),
Excel files (Customers, Vendors, Products, Terms, Documents register, Ledgers) and `backup.json`
(Settings → Restore from backup.json brings everything back). Choose all time or a date range.

## Updating an existing Supabase database
If you already ran an older `schema.sql`, simply run the latest one again – it only adds what is missing
(the new `terms` table) and does not delete data.

## Good habits
- Dashboard → **Export / Backup** → Download ZIP once a month and keep it on Google Drive / a pen drive.
- Supabase free projects pause after a week with no use; open the Supabase dashboard and click *Restore* if the app says it cannot connect.
