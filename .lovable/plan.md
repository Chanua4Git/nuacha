# Edit sign-ups, paid setup sessions, updates catch-up, lesson downloads

## 1. Edit people on the Sign-ups page
- Each person gets an **Edit** button for their WhatsApp number and a private note (e.g. "met at market, wants done-for-you"). Saving updates their row straight away.
- Their progress (household, scans, lessons, questions) keeps updating by itself as they use the app; refresh any time to see the latest.
- First use: add the phone number for chanuajohnson@gmail.com.

## 2. "Setup with Chan" paid session
A new public page, **nuacha.com/setup**, with two choices:

| | Hand-holding | Done-for-you |
|---|---|---|
| Price | TT$100 | TT$300 |
| What happens | We sit together (remote or in person) while you set it up yourself | You bring receipts and family info; we build your profile, budget template and household for you |

- **Try first:** each option has links so people can try before deciding: try a scan (`/?start=scan`), watch the first lesson, see what's possible (the Nuacha map).
- **Paying, step 1:** the person picks an option, chooses remote or in person, and pays one of three ways:
  - **WiPay**, for the exact amount
  - **Pay what you can**, through your WiPay link
  - **Bank transfer**, using your existing bank details and a reference code
- **Booking, step 2:** after paying, they press **Book a time**, which opens your Google Calendar booking page.
- **Your list of requests:** each request is saved with their name, WhatsApp, option, remote or in person, how they paid, and their reference. You'll see them in a **Setup requests** list on Sign-ups, where you can mark each one paid, booked or done.
- **New nudge, "Invite to setup":** it replaces the 5-minute call line with the setup offer and the link.
- **Calendar link:** I'll add a place on Sign-ups to paste it. Until it's added, **Book a time** opens WhatsApp to you instead.

**Updated WhatsApp reply for Butterfly Patisserie:**
> Yay, so happy to hear that! 🌿 Best time is tonight, whenever you're next holding a receipt, or right now if one's in front of you. Open https://nuacha.com/?start=scan, tap **Snap Receipt** and follow the steps. It sorts itself out in under a minute. If anything feels unclear, send me a voice note right here and I'll walk you through it.
>
> Want it set up properly? I offer a setup session, remote or in person. I can hold your hand while you do it (TT$100), or you bring your receipts and family details and I build it all for you (TT$300). Take a look and choose here: https://nuacha.com/setup

## 3. Updates: December 2025 to now
Add What's New entries, dated by month, for what's been built since November 2025:
- Payroll and NIS: history back to 2016, holiday pay, payslips by WhatsApp, cash or bank payment
- Three free scans a day, and the TT$60 trial
- The Nuacha map
- Story cards and monthly summaries
- Accounts, cash withdrawals and "Paid from"
- Credit card tracking
- Garden Ohm business income
- Who-pays-for-what defaults
- **Talk it through**, plus the monthly and daily check-ins
- Guest drafts that wait until you sign in
- Personal prompts
- First-household setup
- WhatsApp help and the learning lessons, with questions

Also add the same features to the **Features** tab so it shows everything Nuacha can do, including Talk it through.

## 4. Downloadable lesson images for socials
These don't exist yet. Each lesson card gets a **Download for socials** button that makes branded images in your Nuacha colours:
- Instagram/TikTok story: 1080×1920
- Instagram feed: 1080×1350
- Square: 1080×1080

Each image shows the lesson title, its 2–5 short steps, and "Try it free at nuacha.com". The images are made in your browser and downloaded straight away; nothing is uploaded. Only the generic lesson content goes on them, never anyone's personal data.

## Technical details
- Run a migration to add `profiles.admin_note text`. Add an admin `update` policy on `profiles` via `has_role`. Admin edits write `profiles.phone_number`. `admin_user_journeys` already prefers `profiles.phone_number`; also return `admin_note`.
- Run a migration to create the `setup_requests` table (`user_id` nullable, `name`, `whatsapp`, `email`, `package hand_holding|done_for_you`, `amount_ttd`, `mode remote|in_person`, `payment_method wipay|pwyw|bank`, `reference`, `status new|paid|booked|done`, `notes`, timestamps). Grants: insert for anon and authenticated, all for service_role. Row-level security: insert open with length limits, read and update for admins only. Also create an `app_settings` table (key/value, readable by anyone, writable by admins only) for `booking_url`.
- New page `src/pages/Setup.tsx` and route `/setup`. It reuses `NUACHA_WIPAY_URL`, `NUACHA_WIPAY_ME_URL` and `NUACHA_BANK_DETAILS`. The WiPay invoice link is a fixed TT$60 invoice, so the TT$100 and TT$300 amounts go through the pay-what-you-want link, showing the exact amount to enter.
- `AdminUsers.tsx`: an Edit dialog, a Setup requests panel, a booking-link setting, and an "Invite to setup" template inserted with SQL.
- Insert the release notes into `release_notes` with SQL, dated Dec 2025 to Oct 2026, `is_published = true`. Extend the features list the Features tab uses.
- `src/components/updates/LessonSocialExport.tsx`: draw the image on a canvas, export it as a PNG and download it, with the font loaded first.
