# Bring back the full receipt display for Talk-it-through receipts

## What's going on
The receipt display still works for receipts added the normal way (Snap/Upload) — e.g. RIAZ 4 Oct, Southern Food Basket and Fair & Square all still have their shop details and line items.

The two that show "No receipt details available" (Aioli dinner and RIAZ groceries, 5 Oct) came in through **Talk it through**. That flow reads the receipt for a summary (shop, date, total), but when you tap Save it keeps only the photo and throws away the itemised reading. So there's nothing for the receipt panel to show.

## Fix
1. **Talk it through keeps the full reading.** When a receipt is read during a check-in, hold on to the whole result. On Save, store the shop details and every line item with the expense, the same way Snap/Upload already does.
2. **Recover the two existing receipts.** Read the saved photos for Aioli and RIAZ (5 Oct) again and fill in their details and line items. Your amounts, categories and "Paid from" stay as they are.
3. **The receipt panel always shows something useful.** If an expense has a photo but no itemised reading, show the photo plus a gentle "Read this receipt" button instead of the empty "No receipt details" message.
4. **Receipt Management page.** Check that check-in receipts show in the gallery with their shop name, filters and export, and fix anything that's missing.

## Technical details
- `VoiceCheckIn.tsx`: add the full `OCRResult` to each `ReceiptPhoto`. After the expense is inserted, call `saveReceiptDetailsAndLineItems(expenseId, ocr)` (in `ocrProcessing.ts`). Do the same in the guest-resume path.
- Recovery: run the normal receipt-reading step again on the stored `receipt_url` for expenses that have a photo but no `receipt_details` row (currently 105065f6…, 0a735955…), then save the details and line items. The expense row itself is not changed.
- `receipt/DetailedReceiptView.tsx`: accept an optional receipt URL. When there are no details, show the signed image and a "Read this receipt" button. That button reads the receipt and saves the details and line items, then refreshes `useReceiptDetails`.
- No database changes.
