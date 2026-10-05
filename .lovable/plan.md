# Put each income in charge of its own spending

## Your rules (as I understand them)
- **Grandma's pension (TT$14,000):** living costs. You took out TT$6,000 in October.
- **Brother's help (TT$6,000):** night and weekend nurses, plus bills.
- **Grandpa's pension (TT$11,000):** Angela's pay only.
- **Backup account (1726):** repairs and one-offs, like the bathroom plumbing.

## Changes to Cash & Accounts (data only)
1. Grandpa's account keeps **only Angela's TT$1,324.70**. The four nurse wages (TT$1,100) move off it.
2. **Grandma's account** gets the TT$6,000 withdrawal on 2 October for "Living costs". Balance shows TT$7,779.82 (from the TT$13,779.82 on the slip).
3. New **Brother's help** account (TT$6,000/month, tied to the same income in Budget Builder). The four nurse wages move here, and TT$4,900 stays open for October's bills — you can link them with "Link an expense or wage" as they come in.
4. Grandpa's TT$50,000 stays editable through **Edit / update balance**.

## Design going forward (your earlier question)
- One household budget: the budget plans and tracks against the combined TT$31,000.
- Each expense also knows which income paid for it — set automatically from Cash & Accounts links, and you can change it.
- The Income tab and Budget Builder will show the real names (Grandma's pension, Grandpa's pension, Brother's help) instead of Primary / Secondary / Other, and a "Who covered what" view will show how much of each income went where.

## Technical details
- Data: update `money_allocations` (remove 4 nurse rows from Grandpa's withdrawal, re-add under a new Brother's help account), insert Grandma's TT$6,000 `cash_withdrawals` row, insert the Brother's help `money_accounts` row.
- Code (later step): rename template income labels, add an income source on expenses, and a "Who covered what" summary.
