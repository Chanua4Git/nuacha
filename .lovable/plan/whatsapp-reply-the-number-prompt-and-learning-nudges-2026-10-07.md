# WhatsApp reply, the number prompt, and learning nudges

## 1. Reply to Butterfly Patisserie (copy and paste)
> Yay, so happy to hear that! 🌿 Best time is tonight or whenever you're next holding a receipt. Open https://nuacha.com/?start=scan, tap **Snap Receipt** and follow the steps. It sorts itself out in under a minute. If anything feels unclear, send me a voice note right here and I'll walk you through it. Want a quick 5-minute call this week so I can show you around?

## 2. Why it asked for your WhatsApp number
Your number **is** saved: +1 868 786 5357, and you don't need to enter it again. Here's why you saw the box anyway:
- The `?add=whatsapp` link always opens the box, and the box didn't check your latest saved details, so it showed up empty.
- Your number is saved on your sign-in account but not on your profile. The Sign-ups page reads the profile, which is why it can look like "no record".

**Fix:**
- If a number is already saved, the box says "We have +1 868 786 5357 on file. Change it?" with a **Keep it** button. The automatic daily reminder never shows for anyone who has a number.
- Saving a number also writes it to the profile, so it shows up on the Sign-ups page.
- A one-time catch-up copies numbers that are already saved (including yours) onto profiles.

## 3. Learning progress you can see, plus next-lesson nudges
Right now, learning progress is kept only in each person's own browser, so you can't see it. Changes:
- **Save lesson progress to their account** (each person sees only their own; admins can see everyone's). Anything already in their browser is uploaded the first time they sign in.
- **A "Learning" column on Sign-ups:** "3 of 13 lessons · last: Snap a receipt · 2 days ago", plus their **next lesson**.
- **Nudge → "Next lesson"** message: "Hi {name}! Next up: {lesson}, about 3 minutes. Tap here: https://nuacha.com/updates?tab=learning&module={id}. Stuck anywhere? Just reply and I'll guide you." It's ready for WhatsApp or email and logged like the other nudges.
- **"Stuck?" / "Ask a question" at the end of each lesson:** a short box (with an emoji rating) that goes into Feedback, tagged with the lesson. On Sign-ups, a person with an unanswered lesson question gets a flag and a **Reply** message that includes their question.
- **Start Here first:** new sign-ups with no lessons done are nudged toward "Getting started – Navigation basics", then their first scan.

## Technical details
- `WhatsAppNumberPrompt.tsx`: on open, call `supabase.auth.getUser()` for fresh metadata and show the existing number with Keep / Change. On save, also `upsert profiles.phone_number`.
- Run a one-time SQL catch-up: `update profiles set phone_number = auth.users.raw_user_meta_data->>'phone_number' where profiles.phone_number is null` (insert a profile row if it's missing).
- Migration: `learning_progress (user_id uuid, module_id text, steps_completed int, completed bool, updated_at)`, primary key `(user_id, module_id)`. Grants for `authenticated` and `service_role`, row-level security for the owner, plus a select policy for admins via `has_role`.
- `useLearningProgress.ts`: when signed in, read/write the table and merge the browser copy once; visitors keep browser-only storage.
- Lesson questions go to `user_feedback` with `category='learning'` and `metadata.module_id`.
- `admin_user_journeys()` gains `lessons_done`, `last_module`, `last_learning_at`, `open_lesson_questions`. Next lesson = first unfinished module in track order. Add a "Next lesson" nudge template.
