import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReleaseNote } from '@/types/updates';

export function useReleaseNotes(category?: ReleaseNote['category']) {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleaseNotes();
  }, [category]);

  const loadReleaseNotes = async () => {
    try {
      let query = supabase
        .from('release_notes')
        .select('*')
        .eq('is_published', true)
        .order('released_at', { ascending: false })
        .order('display_order', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes((data || []) as unknown as ReleaseNote[]);
    } catch (error) {
      console.error('Error loading release notes:', error);
    } finally {
      setLoading(false);
    }
  };

  return { notes, loading, reload: loadReleaseNotes };
}
