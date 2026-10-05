# "Explore all of Nuacha" map + return-visit tease

## Goal
After a scan, and when free users come back the next day, show them everything Nuacha can do (families, people, budgets, payroll, reports), let them learn each part in 2–3 minutes, and gently point to the trial offer for the locked parts.

## What the user will see

### 1. A "Your Nuacha map" section on the dashboard
Added below the current "What you've accomplished", "Suggested next steps" and "Quick actions". These stay as they are.
- 5 areas shown as soft cards: Receipts, Family & people, Budgeting, 🇹🇹 Payroll & NIS, Reports.
- Each card lists 2–4 things you can do in that area (for example, Family & people: set up households, add family members, assign expenses to a person, share receipts with family).
- Each item has a small status:
  - Done (green tick): they have already used it.
  - Try it: free, opens that page.
  - Included in the trial: locked for free users. Tapping it shows a short "what this does" note, the TT$60/month for 3 months offer, and "Maybe later".
- Each card has a "Learn this" link to the matching lesson in Nuacha Learning.
- A progress line at the top: "You've explored 4 of 16 things Nuacha can do."

### 2. Next step after a scan is saved
After the expense saves, a small card says "Nice — that's saved. Did you know you can assign this to a family member?" and gives two buttons: "Show me" (opens family members) and "See everything Nuacha can do" (opens the map).

### 3. When they choose "I'll wait" at the 3-scan limit
The pop-up changes to "Your 3 free scans come back tomorrow. While you wait, here's something you can set up for free," then shows one feature they haven't tried yet and a link to the map.

### 4. Welcome-back banner the next day
A small banner on the dashboard: "Welcome back — your 3 fresh scans are ready." It also shows one feature they haven't tried, rotating each day. They can close it, and it stays closed for that day.

### 5. Easy to find
A "Explore Nuacha" link in the menu and on the Updates page that opens the dashboard map.

## Tone
Soft wording, sentence case, no "you're missing out" pressure. Locked items say "Included in the trial", never "Locked" in red.

## Technical details
- New `src/constants/appMap.ts`: areas, items, route, learning module id, `requiresSubscription`, and a "done" check key. Reuse `featureShowcase.ts` and `learningCenterData.ts` ids.
- New `src/components/dashboard/AppOverviewMap.tsx`, rendered in `src/auth/components/Dashboard.tsx` after Quick actions.
- "Done" status comes from the existing `useUserProgress` data (families, members, expenses, budgets, payroll counts); extend it if a count is missing.
- Locked status comes from `useActiveSubscription`; the trial note reuses `NUACHA_INTRO_OFFER` and opens `SubscriptionPurchaseModal`. The three payment buttons stay unchanged.
- `ScanLimitModal.tsx`: after "I'll wait", show a second step with one suggested feature instead of closing.
- New `WelcomeBackBanner.tsx`: shows on the first visit of each day (date in localStorage), picks the first item that isn't done yet.
- Post-save prompt goes into the existing redirect to the Expenses tab, as a one-time toast-style card.
- Learn links use the existing deep links: `/updates?tab=learning&module=…`.
- Frontend only. No database changes.
