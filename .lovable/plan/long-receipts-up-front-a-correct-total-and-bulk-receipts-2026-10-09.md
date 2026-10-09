# Long receipts up front, a correct total, and bulk receipts

## What's happening today
- **Long receipt is hidden.** You can only choose "long receipt" inside Add Expense, after picking Snap or Upload. The home page and the first-scan link don't offer it at all.
- **The total is wrong when you scan a receipt in sections.** Nuacha picks the amount from whichever single section it feels most sure about. It doesn't use the printed total at the bottom, and it doesn't add the sections together. That's why your 3-part receipt had every item but the wrong total.
- **Bulk receipts are live, in Talk it through.** You can tap "Photos", pick several receipts at once (or snap them one by one), and each one is read separately. You then review the list and tap Save. Add Expense and the home page take one receipt at a time.

## What we'll change

### 1. Choose "long receipt" before taking the photo
Wherever someone is asked to snap or upload (home page, first-scan link, Add Expense), they see three clear choices:

```text
[ Snap receipt ]   [ Upload receipt ]   [ Long receipt (2+ photos) ]
```

- "Long receipt" opens the section-by-section flow directly: photograph the top, then "Add next section", then "Done – read it all".
- A short hint explains it: "Receipt too long for one photo? Take it in parts, top to bottom."
- The current switch inside Add Expense stays, so nothing you're used to goes away.

### 2. Make the long-receipt total correct
When the sections are combined:
1. Use the printed **Total** from the bottom section (the one with the total, tax and payment).
2. If no section shows a printed total, add up all the items from every section, after removing items that appear twice where photos overlap.
3. Show a small check under the result, for example "Items add up to $X · Receipt total $Y". If the two don't match, the difference is pointed out gently so you can glance at it before saving.
4. Each section card shows "Items in this part: $X", plus a running total of all parts so far.

### 3. Make bulk receipts easier to find
- Next to the snap and upload choices, add a link: "Several receipts? Add them all at once", which opens Talk it through with the photo picker.
- Add a short line to the Updates page and the receipt-scanning lesson saying multi-receipt upload is live.

## What stays the same
- Free scans are still 3 a day. Each long-receipt section counts as a scan, as it does now.
- The store date memory and date sense check apply to long and bulk receipts too.

## Technical section
- `src/components/receipt/MultiImageReceiptUpload.tsx` `mergeOCRResults`: today `amount` comes from the highest-confidence section. Replace it with the shared `mergeReceiptPages` logic from `src/utils/receipt/mergeReceipts.ts`, extended so that:
  - the amount is the footer section's `total`/`amount` only when that section has footer signals (total, tax or payment);
  - otherwise the amount is the deduplicated line-item sum.
  - It also returns `itemsSum` and `printedTotal` for the check line.
- Add a per-section subtotal and a running total to the section cards.
- `HeroUploadSection.tsx`: add a "Long receipt" button that goes to `/app?tab=add-expense&mode=long`. `ExpenseForm.tsx` reads `mode=long` to start in long-receipt mode, and the section uploader opens straight into it.
- Add a "Several receipts?" link to `/?talk=true&photos=1`. `VoiceCheckIn` opens the photo picker when `photos=1` is present.
- Tests in `mergeReceipts.test.ts`:
  - three sections where only the last has the printed total, so the merged amount equals the printed total;
  - no printed total, so the merged amount equals the deduplicated item sum;
  - an overlapping duplicate item is counted once.
- Add a rule to `AGENTS.md`: a long receipt's total comes from its footer section, otherwise from the deduplicated item sum, never from the highest-confidence section.
