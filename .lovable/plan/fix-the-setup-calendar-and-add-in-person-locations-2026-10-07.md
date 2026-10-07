# Fix the setup calendar and add in-person locations

## Updated setup order
- Keep the package choice first.
- Ask whether the session is **Remote** or **In person**.
- When **In person** is selected, require one meeting place:
  - Starbucks Maraval
  - Starbucks Brentwood
  - Starbucks Couva
  - Starbucks South Park
  - The Garden Ohm, Freeport
- Keep name, WhatsApp, email, and notes together with the meeting choice.
- Place the working calendar next, then move **How would you like to pay?**, the payment explanation, and **Continue to payment** directly below it.
- Update the two-step wording to match the actual order: details and date first, then payment.

## Make the Google calendar display reliably
- Convert the saved Google short link into Google’s full appointment-schedule URL and use the supported inline format ending in `?gv=true`.
- Keep **Open calendar in a new window** as a reliable fallback.
- Remove the large broken grey frame behavior: if the inline calendar cannot load, show a compact explanation and the open-calendar button instead.
- Keep the post-payment action so customers can reopen or confirm their date.

## Save and administer the meeting place
- Add an optional `meeting_location` field to setup requests.
- Require it only for in-person requests; remote requests store no physical location.
- Show the selected place in **Sign-ups → Setup requests** and include it in the admin WhatsApp confirmation.
- Preserve existing requests without a location.

## Verification
- Test Remote and each In-person location path.
- Confirm payment controls appear below the calendar.
- Confirm the calendar loads in Chrome using the supported Google embed address and the external button opens the same schedule.
- Confirm request saving, admin display, mobile layout, and both fixed-price WiPay links still work.

## Technical details
- Apply a database migration adding nullable `meeting_location text` with a constraint limiting values to the five approved places.
- Keep current grants and owner/admin access rules unchanged; the new value follows the existing setup-request privacy rules.
- Normalize known `calendar.app.google` links to the resolved Google appointment schedule for display, while retaining the saved public link for external opening where appropriate.
