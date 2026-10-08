# Fix "day before" receipt dates everywhere + show Talk-it-through saves in Expenses

## What's going wrong

**Dates:** The receipt reader correctly reads the date on the receipt (e.g. 8 Oct), but it hands it back as "8 Oct at midnight, London time". Trinidad is 4 hours behind, so the app turns that into "7 Oct, 8 pm" and keeps the 7th. Every scan path (Snap, Upload, Talk-it-through) goes through the same reader, which is why all three show the day before.

**After saving in Talk-it-through:** the window closes and leaves you wherever you were, so you have to go find the new entry yourself.

## What will change

1. **Receipt dates stay exactly as printed** — no matter the time of day or where you scan from (Snap, Upload, Talk-it-through, multi-page scans).
2. **One shared date rule** used by every scan path, so a future change in one place can't quietly break another.
3. **Automatic checks** that fail if the "day before" problem ever comes back (e.g. a receipt dated 8 Oct must come out as 8 Oct, including scans done late at night).
4. **After you tap Save in Talk-it-through**, you go straight to Expenses, scrolled to the top, with the entries you just saved gently highlighted for a few seconds and a "Just added" tag.
   - If you only saved withdrawals, transfers or income (no expenses), you stay where you are, as today.
   - Monthly Cash & Accounts check-in keeps its current behaviour.
5. **Recently misdated scans:** I'll check your saved receipts from the last few weeks for entries that are exactly one day earlier than the receipt's own scanned date, list them for you, and only correct them after you say yes.

## Technical details

- `supabase/functions/process-receipt/lovable-ocr.ts`: stop building a `Date` (UTC midnight); return the calendar day as a plain `YYYY-MM-DD` string. Same for the fallback in `index.ts` and `prediction-mapper.ts`.
- New `src/utils/receipt/calendarDate.ts`: `parseReceiptCalendarDate(value)` — takes the first `YYYY-MM-DD` from any string/ISO value and builds a local date via `new Date(y, m-1, d)`; also handles `{value}` objects and existing `Date`s. `toCalendarString(date)` uses `format(date,'yyyy-MM-dd')`.
- Replace `new Date(ocr.date)` in `src/utils/receipt/ocrProcessing.ts` (`extractDate`), `src/components/money/VoiceCheckIn.tsx` (line ~187), and other receipt readers (`dateValidation.ts`/`dateProcessing.ts` fallbacks, `ReceiptGallery`, export utils) with the helper. Also replace `paidOnDate.toISOString().slice(0,10)` in `ExpenseForm.tsx` with the local formatter.
- Add Vitest (dev only) with `src/utils/receipt/calendarDate.test.ts`: asserts `2026-10-08`, `2026-10-08T00:00:00.000Z`, and DD/MM inputs all give 8 Oct under `TZ=America/Port_of_Spain`, plus a late-night case.
- `VoiceCheckIn.save`: collect inserted expense IDs; pass them to `onSaved(ids)`. `TalkItThroughLauncher` navigates to `/app?tab=expenses&new=<ids>` when IDs exist.
- `ExpenseList`: read `new` param, force-refresh the list, scroll to top, highlight matching cards (~6 s) with a "Just added" badge, then clear the param.
- Add an `AGENTS.md` rule: receipt dates travel as calendar strings (`YYYY-MM-DD`), never as timestamps, so time zones can't shift the day.
- Redeploy `process-receipt`.
