# Roadmap

- [x] Focus category suggestions on dental/medical receipt evidence, not unrelated usage frequency.
- [x] Add private, editable child expense evidence report using all household receipts and line items, with reviewed allocations and exports.
- [x] Research T&T maintenance variation requirements and distinguish expense evidence from any predicted court award.
- [ ] Verify child report loading, saving, exporting and source edits while signed in (external Supabase session unavailable).

- [x] Populate the owner's attached shopping list (13 to buy, 25 ticked purchases), refresh suggestions after scans, and request publication of the current shopping page; signed-in verification remains unavailable.

- [x] Make single and bulk saved scans reviewable regardless of receipt date; flag unusual dates and keep just-saved entries visible (six regression tests passed).
- [ ] Verify saved scan review in the signed-in Expenses page (external Supabase browser session unavailable).

- [x] Improve shopping creation from all saved receipt lines: readable household items, recent purchases, usual stores, and reviewed bulk additions (eight logic tests passed).
- [ ] Verify receipt suggestions and bulk additions in the signed-in shopping page (external Supabase browser session unavailable).

- [x] Replace overlapping Learning social menus with image/video previews before downloads; phone and desktop previews, downloads, and prepared receipt-video playback verified.

- [x] Align Learning receipt lessons and automatic reels: shared playback/export, lesson links, and current receipt button names (both previews and video-with-audio download browser-verified).

- [x] Rebuild Sign-ups as a polished admin journey dashboard with summary cards, compact progress rows, expandable user details, grouped test accounts, and a nudge-template sidebar.

- [x] Make each Learning module's social download create a vertical lesson video from the loaded module, while keeping image formats available.

- [x] Clarify setup deliverables, TT$300 onboarding and follow-up quotation, tentative visit schedule, and honest calendar reminder (public page and reminder browser-tested).

- [x] Add booking, package, meeting-place, and calendar deep links to `/updates` and preselect their choices on `/setup`.
- [x] Give every What's New card a relevant deep link to try, learn, or explore that specific update.
- [x] Make `/setup` a clear two-step flow and show the saved booking calendar on the page with a new-window fallback.
- [x] Fix the Google Calendar embed, move payment below it, and save required in-person meeting locations.

- [x] Add setup field guidance, package-specific WiPay invoices, and admin request deletion/status management (payment destinations browser-tested; authenticated admin actions not tested).

- [x] Save setup invitation nudge and add manual-number messaging on Sign-ups (signed-in interaction not tested).

- [x] Add private per-receipt story downloads.
- [x] Add monthly, family, and annual recap story downloads.
- [ ] Verify receipt and recap downloads in the signed-in preview (external Supabase browser sessions cannot be restored automatically).
- [x] Cash & accounts: accounts, withdrawals, links to expenses and wages (October 2026 seeded).
- [ ] Confirm October seed assumptions with the user (0273 withdrawals, pension-as-income, plumbing and nurse links).
- [x] Monthly check-in on Cash & Accounts with voice "Talk it through" (guided + free), transfers, routines, nurse roles.
- [ ] Confirm Leslie-Ann is the regular night nurse and the TT$5,000 Grandpa withdrawal purpose (waiting on user).
- [x] Receipt dates no longer shift to the day before (all scan paths) + automatic checks
- [x] Talk-it-through save opens Expenses with new entries highlighted
- [x] Corrected past scans saved one day early (JTA flagged for owner to check)
- [ ] PINNED: revisit marketing plan — next step is a public pricing page + fix crossed-out TT$149 (plan saved in Files).
- [x] Tutorial Reel Studio at /admin/reels with the "Scan your first receipt" reel.
- [x] Make the first two tutorial reels automatic: drawn scenes, scripted taps, sound, text-only editing, video and PNG downloads; sample frames and 1080×1920 audio/video verified.
- [ ] Verify saved text and downloads through the signed-in admin page (external Supabase session unavailable to automated checks).
- [ ] Remaining eight automatic reels (waiting on owner to approve the first two).

## Co-parenting
- [ ] Always open co-parenting on the welcome cards, with working section links and setup CTA, for signed-in and signed-out visitors.
- [x] Add invited-email sign-in on the public page and restrict invited viewers to timeline-only access; public handoff and phone layout tested, separate calls now owner-only.
- [ ] Verify owner invitation and brother's signed-in timeline-only view (external Supabase authenticated browser access unavailable).
- [ ] Separate co-parenting shared-link preview (waiting on upgrade decision; current previews unchanged).
- [x] Timeline redesign (compact rail, phases, colours, Important, status fix, call coverage)
- [ ] Phase editing in settings (phases currently fixed)
- [ ] Access & calls redesign (role-neutral outcomes, schedules, call-history import)
- [ ] Summary rebuilt as court-ready report (sort dates, split 2019/2020 entry, presets, PDF/Word)
- [x] Co-parenting setup for new families (6 steps), role labels, private safety answer, nuacha.com share link
- [ ] "Getting ready" track, history import, T&T info pack (needs lawyer review), shared/professional access
