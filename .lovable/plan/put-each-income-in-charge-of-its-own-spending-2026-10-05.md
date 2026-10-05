# Put each income in charge of its own spending

## Your rules
- **Grandma's pension (TT$14,000):** living costs. TT$6,000 taken out on 2 Oct — that TT$6,000 is cash in hand; the bank balance stays TT$13,779.82. When it's used up, you take out more and log it, and cash expenses link to that pool.
- **Brother's help (TT$6,000):** night and weekend nurses, plus bills.
- **Grandpa's pension (TT$11,000):** Angela's pay only. Balance stays TT$50,000 (editable).
- **Backup account (1726):** repairs and one-offs. Balance TT$43,998.03 (one TT$3,000 withdrawal for the plumbing; the second one is removed).
- **Chan's account:** new, balance TT$5,000 (editable).

## Changes to Cash & Accounts (data only)
1. Grandpa's account keeps **only Angela's TT$1,324.70**. The four nurse wages (TT$1,100) move off it.
2. **Grandma's account** gets the TT$6,000 withdrawal on 2 October, "Living costs", with no balance change. You'll link cash expenses to it as you spend.
3. New **Brother's help** account (TT$6,000/month, tied to the same income in Budget Builder). The four nurse wages move here; TT$4,900 stays open for October's bills.
4. **Backup account:** remove the second TT$3,000 withdrawal; the plumbing's second part (TT$2,800) joins the first withdrawal. Balance shows TT$43,998.03.
5. New **Chan's account** with a TT$5,000 balance, editable like the others.

## Design going forward (your earlier question)
- One household budget: the budget plans and tracks against the combined TT$31,000.
- Each expense also knows which income paid for it — set automatically from Cash & Accounts links, and you can change it.
- The Income tab and Budget Builder will show the real names (Grandma's pension, Grandpa's pension, Brother's help) instead of Primary / Secondary / Other, and a "Who covered what" view will show how much of each income went where.

## Technical details
- Data: update `money_allocations` (remove 4 nurse rows from Grandpa's withdrawal, re-add under a new Brother's help account; move the TT$2,800 plumbing allocation to the first withdrawal), insert Grandma's TT$6,000 `cash_withdrawals` row (no balance), delete the second 1726 withdrawal, insert the Brother's help and Chan `money_accounts` rows.
- Code (later step): rename template income labels, add an income source on expenses, and a "Who covered what" summary.
