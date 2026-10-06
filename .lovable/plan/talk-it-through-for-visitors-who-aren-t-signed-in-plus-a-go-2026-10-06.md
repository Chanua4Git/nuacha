# Talk it through for visitors who aren't signed in, plus a go-to-market focus

## Goal
Anyone on nuacha.com can tap **Talk it through**, say what they spent and add receipts, then sign in or sign up without leaving the window. Their note is kept, and once they're signed in it goes straight to "Here's what I understood". The talking comes first, the account comes after. This keeps the product work small (about 10–15%) and makes it easy to show off in videos and posts.

## What visitors will see
1. The mic button also shows when nobody is signed in, on the homepage and the public pages.
2. They speak or type, and add receipts if they like. Nothing is read or saved yet.
3. They tap **See what I understood** and the same window shows: *"Let's keep this safe for you. Sign in or create a free account. Your note will be waiting."*
   - Choices: **Continue with Google**, or email + password, with one switch between "I'm new" and "I have an account". The system already knows whether an email is registered, so this switch is set for them.
   - Typing is needed for the email and password. Speaking a password out loud isn't safe, and voice often gets email addresses wrong. The mic stays available for the note itself.
4. After they sign in or confirm their email, the window opens again with their note and receipts. It reads them and shows the lines to review. Nothing saves until they tap **Save**.
5. New accounts get the usual household setup, then the review appears.
6. The free limit of 3 receipt scans a day still applies. Receipts are only read after sign-in.

## Edge cases
- Email confirmation in another tab: the note is kept on the device for 24 hours and comes back when they return signed in.
- If they close the window, the note stays as a draft. A small "You have an unsaved note" line offers to continue.
- Receipt photos are kept on the device until sign-in. They are never uploaded before that.

## Go-to-market (not app work, runs alongside)
I'll put together a simple **launch kit** for you to use:
- A 30-second screen-recording script for the "just came from the grocery" moment, for Stories, Status, Reels and TikTok.
- 5 ready-to-post messages for Facebook groups in T&T: co-parenting and separated parents, caregivers of elderly parents, mom groups, small business owners. Each one follows the group's rules and is written to be helpful, not salesy.
- Outreach notes for family lawyers and mediators, and for home-care nursing agencies, as a referral angle ("Help clients keep clean shared-expense records").
- A weekly rhythm: post every day, comment and help in 3 groups each day, and do 1 partner outreach each week. Track it in Google Analytics, which is already on the site.
- A short feedback question after a visitor's first saved check-in ("Was that easy? 😊 😐 😕"), using the feedback system you already have.

## Technical details
- `TalkItThroughLauncher`: show it when there's no user too, but hide it on the auth pages and `/admin`. Don't load accounts or families for guests.
- `VoiceCheckIn`: add a `guest` mode. `understand()` checks the session, and if there isn't one it saves the draft `{free, period, receipts as dataURLs}` to localStorage under `nuacha:checkin-draft` (with a 24h expiry) and shows an inline `GuestAuthStep`.
- `GuestAuthStep`: reuses the `email_registered` RPC, `supabase.auth.signInWithPassword` / `signUp` (with `emailRedirectTo` set to `/?resume=checkin`) and the existing Google OAuth helper, with the redirect set to `/?resume=checkin`.
- On sign-in (in the launcher, using `onAuthStateChange` or the `resume=checkin` query): if a draft exists, open the window, rebuild the receipt Files from the dataURLs, upload them and read them through the existing flow, call `money-voice-parse`, then clear the draft.
- The edge function doesn't change. It still needs sign-in, so the parsing stays protected.
- Record the rule in AGENTS.md: guest check-in drafts stay on the device until sign-in; nothing is uploaded or parsed before sign-in.
- Add GA events: `checkin_open_guest`, `checkin_auth_prompt`, `checkin_auth_complete`, `checkin_saved`, to measure drop-off at each step.
