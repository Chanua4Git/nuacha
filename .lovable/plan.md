

## Add Total NIS Contributions Card

### What changes
Add a 6th summary card showing **Total NIS Contributions** (employer + employee combined) to the Summary & Export tab, placed after the two individual NIS cards and before Total Net Pay.

### Technical details

**File: `src/components/payroll/EnhancedPayrollCalculator.tsx`**

1. Change the grid from 5 columns to 6: `lg:grid-cols-6`
2. Insert a new card after the NIS Employee Contributions card (after line 725) showing:
   - Label: "Total NIS Contributions"
   - Value: `totalNISEmployer + totalNISEmployee` displayed in purple/violet
3. The card order will be:
   - Total Days Worked
   - Total Calculated Pay
   - NIS Employer Contributions (blue)
   - NIS Employee Contributions (orange)
   - **Total NIS Contributions (purple) -- NEW**
   - Total Net Pay (green)

No other files need changes.

