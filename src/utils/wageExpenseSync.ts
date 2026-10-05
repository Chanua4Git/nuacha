import { supabase } from '@/integrations/supabase/client';

/**
 * Keeps one "Wages – Name – Shift" expense in step with a saved payroll week.
 * Skips weeks that already have a hand-entered wage expense (e.g. from Quick Pay).
 */
export const syncWageExpense = async (params: {
  employeeId: string;
  weekStart: string;
  shiftName?: string | null;
  familyId?: string | null;
}) => {
  try {
    const { data: entry } = await supabase
      .from('payroll_entries')
      .select('id, week_start_date, week_end_date, pay_day_date, gross_pay, recorded_pay, payment_method, employees(first_name,last_name,user_id)')
      .eq('employee_id', params.employeeId)
      .eq('week_start_date', params.weekStart)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!entry) return;
    const emp: any = (entry as any).employees;
    const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';
    const amount = Number(entry.recorded_pay) > 0 ? Number(entry.recorded_pay) : Number(entry.gross_pay) || 0;

    const { data: existing } = await supabase.from('expenses').select('id, family_id').eq('payroll_entry_id', entry.id).maybeSingle();

    if (amount <= 0) {
      if (existing) await supabase.from('expenses').delete().eq('id', existing.id);
      return;
    }

    const weekEnd = entry.week_end_date ?? entry.week_start_date;
    if (!existing) {
      const { data: manual } = await supabase
        .from('expenses')
        .select('id')
        .eq('place', 'Payroll')
        .is('payroll_entry_id', null)
        .ilike('description', `Wages - ${name}%`)
        .gte('date', entry.week_start_date)
        .lte('date', weekEnd)
        .limit(1);
      if (manual && manual.length) return;
    }

    let familyId = existing?.family_id ?? params.familyId ?? localStorage.getItem('selectedFamilyId');
    if (!familyId && emp?.user_id) {
      const { data: fam } = await supabase.from('families').select('id').eq('user_id', emp.user_id).limit(1).maybeSingle();
      familyId = fam?.id ?? null;
    }
    if (!familyId) return;

    const isNight = /night/i.test(params.shiftName ?? '');
    const { data: cats } = await supabase.from('categories').select('id,name').eq('family_id', familyId);
    const find = (re: RegExp) => (cats ?? []).find((c) => re.test(c.name))?.id;
    const categoryId = (isNight ? find(/night nurse/i) : find(/day nurse/i)) ?? find(/wage|salar|nurse|payroll/i) ?? cats?.[0]?.id;
    if (!categoryId) return;

    const payload = {
      family_id: familyId,
      amount,
      description: `Wages - ${name}${params.shiftName ? ` - ${params.shiftName}` : ''}`,
      category: categoryId,
      budget_category_id: categoryId,
      date: entry.pay_day_date ?? weekEnd,
      place: 'Payroll',
      expense_type: 'actual',
      payment_method: entry.payment_method === 'bank_transfer' ? 'bank_transfer' : 'cash',
      payroll_entry_id: entry.id,
    };
    if (existing) await supabase.from('expenses').update(payload).eq('id', existing.id);
    else await supabase.from('expenses').insert(payload);
  } catch (error) {
    console.error('Could not sync wage expense:', error);
  }
};

export const removeWageExpense = async (payrollEntryId: string) => {
  await supabase.from('expenses').delete().eq('payroll_entry_id', payrollEntryId);
};
