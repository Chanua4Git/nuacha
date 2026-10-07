# Admin "New sign-ups" monitor + nudges, and restore missing receipts

## Confirmed current state
- chanuajohnson4@gmail.com already has the admin role. No change needed.
- That account has 79 expenses with receipt photos attached, so the receipts still exist. They aren't showing on the Receipts page, so something in how the page loads or filters them is hiding them.

## 1. Bring receipts back on the Receipts page
- First step: reproduce it while signed in and find the exact reason. Likely suspects: a saved Max amount filter (the screenshot shows 1000.00), the expense list stopping at the 1,000-row limit before older receipts, or the family filter.
- Fix the cause. The filters should start empty, and the receipt list should be loaded directly so it isn't cut off by the general expense limit.
- Check it signed in: all 79 receipts appear.

## 2. Admin "New sign-ups" page (admin only)
One page listing every user, newest first. Each row shows:
- Name/email, phone/WhatsApp (or "missing"), how they signed up (Email / Google), when they joined, and when they were last active.
- Progress checklist: Account created → Phone added → Household set up → First scan → 3 scans in one day.
- A "What's missing" tag showing their next step (e.g. "Needs phone", "No household yet", "Hasn't scanned", "1 of 3 scans today").
- Last nudge sent and when.
- Filters: Stuck (no scan yet), Missing phone, Joined in the last 7 days, Reached 3 scans.

## 3. Nudging
- A "Nudge" button on each row picks a ready-made message that matches their missing step. Each message is soft and warm, and the text can be edited before sending.
- Sending opens WhatsApp (wa.me link with the message filled in) if they have a phone, otherwise an email draft (mailto). This uses no paid WhatsApp service.
- Every nudge is logged, so the page shows "Nudged 2 days ago" and avoids double-nudging.
- Starter messages: Needs phone, No household, First scan, Get to 3 scans today, Re-engage after 3 quiet days.
- A small editor on the same page to edit or add messages.

## 4. Tracking
- Send Google Analytics events at each step (household created, receipt scanned, third scan of the day) so the Google Analytics funnel matches the admin checklist.

## 5. Branded link previews (WhatsApp, Instagram, Facebook, X)
- Replace the Lovable image currently shown when nuacha.com links are shared with a Nuacha-branded preview image (calm household scene, Nuacha wordmark, tagline "A softer way to track spending").
- Remove the Lovable placeholder image and the "@lovable_dev" handle from the site's preview settings.
- Give the main shared pages their own wording: Learning Center ("Learn Nuacha step by step"), Updates, Get started / plans, Payroll, and Budget.
- Honest limit: WhatsApp and Facebook only read the site's single default preview, so every link will show the Nuacha image and the main Nuacha wording. Per-page wording shows up in Google and other apps that run the page's code. Fully separate previews for each page would need the app upgraded to a newer setup, which can come later.
- After publishing, WhatsApp may keep showing the old preview for a while. Pasting the link into Facebook's Sharing Debugger forces a refresh.

## Technical details
- Link previews: generate a 1200x630 og image into `public/og-nuacha.jpg`, set absolute `https://nuacha.com/og-nuacha.jpg` for og:image/twitter:image, and add og:url, og:site_name, and twitter:title/description in index.html. Add react-helmet-async per-route titles and descriptions for key routes.
- New tables: `nudge_templates` (name, stage, channel, message) and `admin_communications` (admin_id, target_user_id, template_id, message, channel, sent_at). Both include GRANTs, and RLS limits access to `has_role(auth.uid(),'admin')`.
- A security-definer function `admin_user_journeys()` checks `has_role` and returns one row per user from auth.users + profiles + families + scan_usage + last communication. Progress is calculated live, with no cached snapshot table.
- Route `/admin/users`, protected by `useAdminRole` and linked from the admin menu. Reuse existing WhatsApp helpers in `src/utils/whatsapp.ts`.
- Receipts: query expenses that have receipt_url/receipt_image_url directly, with paging, and remove any persisted default for maxAmount.
