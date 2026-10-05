import { useEffect, useMemo, useState } from 'react';
import { Download, Image as ImageIcon, Loader2, Receipt, Sparkles } from 'lucide-react';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Expense, Family, CategoryWithCamelCase } from '@/types/expense';
import { createStoryImage, receiptStorySubtitle, StoryImageData, StoryKind, storyFilename } from '@/utils/storyImage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  expenses?: Expense[];
  categories?: CategoryWithCamelCase[];
  families?: Family[];
  selectedFamily?: Family | null;
  periodLabel?: string;
  initialKind?: StoryKind;
}

type SummaryData = {
  families: Family[];
  expenses: Expense[];
  memberCount: number;
  assignedExpenseCount: number;
  categoryNames: Map<string, string>;
};

const EMPTY_SUMMARY: SummaryData = {
  families: [],
  expenses: [],
  memberCount: 0,
  assignedExpenseCount: 0,
  categoryNames: new Map(),
};

const toExpense = (item: any): Expense => ({
  id: item.id,
  familyId: item.family_id,
  amount: Number(item.amount || 0),
  description: item.description,
  category: item.category,
  date: item.date,
  place: item.place,
  receiptUrl: item.receipt_url,
  receiptImageUrl: item.receipt_image_url,
});

const topCategoryNames = (expenses: Expense[], names: Map<string, string>) => {
  const counts = expenses.reduce<Record<string, number>>((result, expense) => {
    const key = expense.category || 'uncategorized';
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => `${names.get(id) || 'Uncategorized'} • ${count} scan${count === 1 ? '' : 's'}`);
};

const uniqueBusinesses = (expenses: Expense[]) => Array.from(new Set(expenses.map((item) => item.place?.trim()).filter(Boolean)));

export function StoryExportDialog({
  open,
  onOpenChange,
  expense,
  expenses = [],
  categories = [],
  families = [],
  selectedFamily,
  periodLabel,
  initialKind,
}: StoryExportDialogProps) {
  const [kind, setKind] = useState<StoryKind>(initialKind || (expense ? 'receipt-card' : 'monthly'));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [summary, setSummary] = useState<SummaryData>(EMPTY_SUMMARY);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind || (expense ? 'receipt-card' : 'monthly'));
  }, [expense, initialKind, open]);

  useEffect(() => {
    if (!open || expense) return;
    let active = true;
    const loadSummary = async () => {
      const [familiesResult, expensesResult, membersResult, allocationsResult, categoriesResult] = await Promise.all([
        supabase.from('families').select('id,name,color').order('name'),
        supabase.from('expenses').select('id,family_id,amount,description,category,date,place,receipt_url,receipt_image_url'),
        supabase.from('family_members').select('id'),
        supabase.from('expense_members').select('expense_id'),
        supabase.from('categories').select('id,name'),
      ]);
      const error = familiesResult.error || expensesResult.error || membersResult.error || allocationsResult.error || categoriesResult.error;
      if (error) throw error;
      if (!active) return;
      const categoryNames = new Map<string, string>((categoriesResult.data || []).map((item: any) => [item.id, item.name]));
      setSummary({
        families: (familiesResult.data || []).map((item: any) => ({ id: item.id, name: item.name, color: item.color })),
        expenses: (expensesResult.data || []).map(toExpense),
        memberCount: membersResult.data?.length || 0,
        assignedExpenseCount: new Set((allocationsResult.data || []).map((item: any) => item.expense_id)).size,
        categoryNames,
      });
    };
    loadSummary().catch(() => toast.error('We could not prepare every recap just yet.'));
    return () => { active = false; };
  }, [expense, open]);

  const storyData = useMemo<StoryImageData>(() => {
    if (expense) {
      const category = categories.find((item) => item.id === expense.category)?.name || 'Expense organized';
      return {
        kind,
        eyebrow: 'New scan on Nuacha',
        title: expense.place || expense.description,
        subtitle: receiptStorySubtitle(expense.date),
        category,
        receiptPath: expense.receiptImageUrl || expense.receiptUrl,
        highlights: ['Receipt safely saved', 'Expense neatly categorized', 'Private details stay private'],
      };
    }

    const knownNames = summary.categoryNames.size
      ? summary.categoryNames
      : new Map(categories.map((item) => [item.id, item.name]));

    if (kind === 'family') {
      const allExpenses = summary.expenses.length ? summary.expenses : expenses;
      const allFamilies = summary.families.length ? summary.families : families;
      const assignedShare = allExpenses.length ? Math.round((summary.assignedExpenseCount / allExpenses.length) * 100) : 0;
      return {
        kind,
        eyebrow: 'Households organized with care',
        title: 'One calm place for every household',
        subtitle: 'Nuacha keeps each family and person thoughtfully separated.',
        metrics: [
          { value: String(allFamilies.length), label: 'households organized' },
          { value: String(summary.memberCount), label: 'people set up' },
          { value: String(allExpenses.length), label: 'expenses recorded' },
          { value: `${assignedShare}%`, label: 'records assigned to people' },
        ],
        highlights: topCategoryNames(allExpenses, knownNames),
      };
    }

    if (kind === 'annual') {
      const selectedYear = Number(periodLabel?.match(/\b(20\d{2})\b/)?.[1]) || new Date().getFullYear();
      const source = (summary.expenses.length ? summary.expenses : expenses).filter((item) => new Date(item.date).getFullYear() === selectedYear);
      const months = new Set(source.map((item) => new Date(item.date).getMonth())).size;
      const householdIds = new Set(source.map((item) => item.familyId)).size;
      return {
        kind,
        eyebrow: `${selectedYear} with Nuacha`,
        title: 'A year of clearer household records',
        subtitle: 'A private recap of the organizing — never the amounts.',
        metrics: [
          { value: String(source.filter((item) => item.receiptImageUrl || item.receiptUrl).length), label: 'receipts scanned' },
          { value: String(months), label: 'active months' },
          { value: String(uniqueBusinesses(source).length), label: 'businesses recorded' },
          { value: String(householdIds), label: 'households covered' },
        ],
        highlights: topCategoryNames(source, knownNames),
      };
    }

    const businesses = uniqueBusinesses(expenses);
    return {
      kind: 'monthly',
      eyebrow: periodLabel || format(new Date(), 'MMMM yyyy'),
      title: 'This month, the receipts found their place',
      subtitle: 'A little less paper. A little more clarity.',
      metrics: [
        { value: String(expenses.filter((item) => item.receiptImageUrl || item.receiptUrl).length), label: 'receipts scanned' },
        { value: String(businesses.length), label: 'businesses recorded' },
        { value: String(new Set(expenses.map((item) => item.category)).size), label: 'categories organized' },
        { value: String(selectedFamily ? 1 : new Set(expenses.map((item) => item.familyId)).size), label: 'households in view' },
      ],
      highlights: [...topCategoryNames(expenses, knownNames).slice(0, 2), ...businesses.slice(0, 2).map((name) => `Seen at ${name}`)],
    };
  }, [categories, expense, expenses, families, kind, periodLabel, selectedFamily, summary]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsRendering(true);
    createStoryImage(storyData)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
        setPreviewBlob(blob);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : 'The story image could not be prepared.');
      })
      .finally(() => active && setIsRendering(false));
    return () => { active = false; };
  }, [open, storyData]);

  const handleDownload = () => {
    if (!previewBlob) return;
    saveAs(previewBlob, storyFilename(storyData));
    toast.success('Your story image is ready to share.');
  };

  const availableKinds: Array<{ value: StoryKind; label: string }> = expense
    ? [
        { value: 'receipt-card', label: 'Scan card' },
        { value: 'receipt-blur', label: 'Blurred receipt' },
      ]
    : [
        { value: 'monthly', label: 'Monthly' },
        { value: 'family', label: 'Family' },
        { value: 'annual', label: 'Annual' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create a Nuacha story
          </DialogTitle>
          <DialogDescription>
            Amounts, people’s names, and readable receipt details stay out of every image.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(value) => setKind(value as StoryKind)}>
          <TabsList className="grid h-auto w-full" style={{ gridTemplateColumns: `repeat(${availableKinds.length}, minmax(0, 1fr))` }}>
            {availableKinds.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="whitespace-normal py-2">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mx-auto flex aspect-[9/16] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-md border bg-muted">
          {isRendering ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-sm">Preparing your story…</span>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Nuacha story preview" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe later</Button>
          <Button onClick={handleDownload} disabled={!previewBlob || isRendering}>
            {expense ? <Receipt className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
            Download story
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}