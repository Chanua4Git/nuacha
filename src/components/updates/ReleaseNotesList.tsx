import { useState } from 'react';
import { useReleaseNotes } from '@/hooks/useReleaseNotes';
import { ReleaseNoteCard } from './ReleaseNoteCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReleaseNote } from '@/types/updates';
import { format, startOfMonth, isSameMonth } from 'date-fns';

const CATEGORIES: Array<{ value: ReleaseNote['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All Updates' },
  { value: 'feature', label: 'Features' },
  { value: 'improvement', label: 'Improvements' },
  { value: 'bugfix', label: 'Bug Fixes' },
  { value: 'how-to', label: 'How-To Guides' },
  { value: 'showcase', label: 'Showcases' },
];

export function ReleaseNotesList() {
  const [selectedCategory, setSelectedCategory] = useState<ReleaseNote['category'] | 'all'>('all');
  const { notes, loading } = useReleaseNotes(selectedCategory === 'all' ? undefined : selectedCategory);

  // Group notes by month
  const groupedNotes = notes.reduce((acc, note) => {
    const monthKey = format(startOfMonth(new Date(note.released_at)), 'MMMM yyyy');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(note);
    return acc;
  }, {} as Record<string, ReleaseNote[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Grouped Notes */}
      {Object.keys(groupedNotes).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No updates yet. Check back soon!</p>
        </div>
      ) : (
        Object.entries(groupedNotes).map(([month, monthNotes]) => (
          <div key={month} className="space-y-4">
            <h3 className="text-2xl font-semibold">{month}</h3>
            <div className="space-y-4">
              {monthNotes.map((note) => (
                <ReleaseNoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
