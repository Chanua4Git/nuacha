# Make setup scheduling clear and visible

## Customer flow
- Add a clear two-step indicator near the top of `/setup`:
  1. **Your details & payment**
  2. **Pick your date on the calendar**
- Explain before the form that customers can view availability immediately, while their appointment is only secured after they complete the setup request and payment step.
- Show the saved Google appointment calendar directly on `/setup` in a full-width scheduling section, so customers can browse and choose an available date without wondering where to go.
- Include a prominent **Open calendar in a new window** button beside the embedded calendar for smaller screens and for browsers where Google blocks the embedded view.

## After payment
- Keep the confirmation screen and make **Pick or confirm your date** the primary next action.
- Send that action to the same saved Google Calendar booking page.
- Keep the WhatsApp fallback only when no calendar link has been saved.

## Clarity and safeguards
- Clearly state that payment and calendar booking are separate confirmations, using Nuacha’s calm, supportive language.
- Do not mark a setup request as booked merely because the calendar was opened; the existing admin status remains the source of truth.
- Preserve both packages, all three payment methods, references, and current request administration unchanged.

## Verification
- Check `/setup` on desktop and mobile widths for readable steps, a usable calendar area, and no overlap or horizontal scrolling.
- Test both package flows through request confirmation and verify every calendar button uses the saved booking link.
- Confirm the WhatsApp fallback still works when no booking link is configured.

## Technical details
- Read `app_settings.booking_url` once and reuse it for both the inline calendar and post-payment booking actions.
- Use a constrained responsive iframe with an accessible title and lazy loading; pair it with an external-link fallback because third-party browser restrictions can prevent inline display.
- Keep all scheduling browser-side through Google’s public appointment page; no Google Calendar account connection or access to private calendar data is needed.
