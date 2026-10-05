# Private Nuacha story visuals

## Goal
Give `chanuajohnson4@gmail.com` a private way to download polished 1080 × 1920 story images from real Nuacha activity, creating steady social proof without exposing spending amounts, people’s names, or readable receipt details.

## What will be added

### 1. Download icon on each scanned expense
- Add a download/share-image icon beside the existing details, edit, and delete actions.
- Show it only for expenses with a receipt and only when the signed-in account is `chanuajohnson4@gmail.com`.
- Opening it presents two choices:
  - **Nuacha scan card:** a branded “New scan on Nuacha” story with the business name, broad category, scan date, Nuacha branding, and `nuacha.com`.
  - **Blurred receipt:** the real receipt becomes a strongly blurred background. The recognized business name is added separately as clear text; all prices, dates, card details, addresses, and line items remain unreadable.
- Provide a preview and one clear **Download story** action. The image is created in the browser and is not uploaded or made public.

### 2. Monthly scan recap
- Add a **Create story recap** action to the expense/reporting area.
- Use the selected month and family filters already available in Nuacha.
- Show scan count, number of businesses, top categories, and a short list of business names.
- Do not show totals, individual amounts, receipt details, or people’s names.

### 3. Family overview story
- Show how Nuacha helps organize multi-household life: number of households, number of people assigned, number of expenses organized, and category/allocation percentages.
- Use neutral labels such as “Household 1” in the public image rather than exposing people’s names.
- If assignment data is incomplete, describe only the records Nuacha can verify rather than estimating a split.

### 4. Annual recap story
- Let the user choose a year.
- Show total scans, active months, businesses recorded, households organized, and category percentages or ranked categories.
- Keep all spending amounts and people’s names hidden.

## Visual direction
- Match the uploaded Nuacha story reference: soft ivory background, muted blue, blush and green accents, editorial heading type, Trinidad & Tobago cue, and restrained botanical details.
- Keep each story readable at phone size with one main message, generous spacing, and `nuacha.com` as the closing action.
- Use the uploaded flyer as visual reference only, not as a background image or embedded asset.

## Privacy safeguards
- Raw receipt images continue to use Nuacha’s private signed-link flow.
- The blurred-receipt design blurs the entire original image and overlays only approved data; it does not attempt risky partial redaction.
- Generated images remain temporary browser files unless manually downloaded.
- No amount, personal name, payment detail, address, receipt number, or item-level text appears in any share image.
- Existing receipt, payment, and download behavior remains unchanged.

## Technical details
- Add a reusable story renderer with fixed 9:16 dimensions and browser PNG export using the project’s existing canvas/screenshot libraries.
- Add a receipt-story dialog connected to the action row in `ExpenseCard` and wired through `ExpenseList`.
- Reuse the private receipt signed-URL helper; load the image with safe cross-origin handling before blur/render.
- Add summary aggregation for monthly, family, and annual story data from the current user’s expenses, families, members, and expense assignments.
- Add the recap entry point to the existing Reports page and wire the currently inactive export area to the story options without changing PDF/CSV behavior elsewhere.
- Gate every entry point to the selected account in the interface; this is a private test feature, not a new authorization boundary or public data endpoint.

## Verification
- Test the per-receipt download with “Southern Food Basket, Couva” and confirm only the business name and approved summary fields are readable.
- Inspect both receipt styles and all three recap formats at full 1080 × 1920 resolution.
- Test mobile controls and downloads, missing receipt images, incomplete member assignments, empty months, and annual data spanning multiple families.
- Confirm no horizontal overflow and that existing details, edit, delete, PDF, and CSV actions still work.
