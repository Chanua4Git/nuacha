# Nudge: add household persons & budget

## Goal
Give admin a ready-to-send nudge encouraging new users (like elevatedaffairstt@gmail.com, who has 0 persons and 0 budgets) to add the people in their household and set up a budget — the natural next step after signing up.

## What we'll build

1. **New reusable nudge template in Sign-ups admin** (`/admin/users`):
   - Title: "Add your people & budget"
   - Warm, non-shaming copy in Nuacha's voice, with deep links:
     - Add household persons → link to the family/persons setup page
     - Set a gentle budget → link to the budget page
     - Offer of hand-holding → `https://nuacha.com/setup`
   - Available in the template picker and the "Nudge a number" manual flow, like the existing first-scan and learning nudges.

2. **Smarter next-step hint on each user card** (small addition):
   - The Sign-ups card already shows scans/expenses; add a check for persons count and budget presence so the suggested next step reads e.g. "Add household persons" or "Set up a budget" when those are missing — so you can see at a glance who needs this nudge.

## Technical notes
- Template copy stored alongside existing nudge templates in the Sign-ups admin code.
- Person/budget counts come from `family_members` (by family_id) and `budgets` / `budget_allocations` — schema confirmed.
- No database changes; no changes to user-facing flows.
