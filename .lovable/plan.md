# Daily "Talk it through" check-in, one tap from anywhere

A quick daily, or whenever-you-remember, check-in. Say what happened ("Today I took 1,000 from the ATM, paid Schawn 300, gas 250...") for today, the last few days or the last week, add receipt photos, and Nuacha turns it all into entries for you to check.

## 1. Easy to find
- A round **"Talk it through"** button (microphone) sits in the bottom corner of every page when you're signed in. You don't need to go to Expenses or Cash & Accounts.
- A small card at the top of the home page and the Expenses page: "How did today go? Talk it through". After you check in, it says "All caught up".
- The navigation menu has a "Talk it through" item.
- The existing button in Cash & Accounts stays where it is.

## 2. The daily check-in
- It opens straight on **"Just tell me"**, with one big Speak button, a box to type in, and an **"Add receipts"** button (camera or photos, several at once).
- A choice for the time period: **Today / Last 2–3 days / This week** (Today is picked to start). Words like "yesterday" or "Monday" are worked out for you.
- The monthly question-by-question check-in stays as the second tab.

## 3. Receipts and what you said, put together
- Each photo is read by the same receipt scanner you already use (shop, date, total, category).
- Nuacha matches receipts to what you said. If you said "groceries at Massy, about 600" and there's a Massy receipt for 612.40, they become **one** entry, using the receipt's amount and keeping the photo. Receipts you didn't mention become their own entries.
- The review list shows a small receipt picture on lines that have one, a category already picked, and a guessed "Paid from" (for example, ATM cash). Every line can be edited or removed. **Nothing saves until you tap Save.**
- The scan limit doesn't apply to your account, as now. Other users would keep their usual daily scan limit.

## 4. Gentle nudge (optional)
- If you haven't checked in for 2 days or more, the home card says softly: "It's been a couple of days. Want to catch up?" There's no pressure and no warning colours.

## Technical details
- Global `TalkItThroughLauncher` in the signed-in layout, used for the floating button, nav item and home/Expenses card. It reuses `VoiceCheckIn` with a new `mode="daily"`, defaulting to the free tab, with a period chip.
- Receipts: upload to the existing private receipts bucket, then call `process-receipt` for each image (scan limits stay enforced server-side). Pass the OCR summaries (`vendor`, `date`, `total`, `suggested category`) to `money-voice-parse` as `receipts[]`. The schema gains `receipt_index` (nullable) per item, and the prompt merges spoken items with receipts (receipt amount wins).
- Saving: expense rows carry `receipt_url`, and line items and receipt details are saved through the existing receipt-save helpers. Paid-from goes through `setPaidFrom`, with the withdrawal pot for "ATM cash".
- Last check-in date is stored per user (a small `last_checkin_at` on `profiles`, through a migration with grants unchanged) to drive the card and nudge.
- Rules already in AGENTS.md still apply: parse into suggestions only, and write after review.
