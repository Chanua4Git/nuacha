import { supabase } from '@/integrations/supabase/client';
import { releaseNotesData } from '@/constants/releaseNotesData';
import { toast } from 'sonner';

export async function seedReleaseNotes() {
  try {
    console.log('Starting release notes seeding...');
    
    // Check if data already exists
    const { data: existing, error: checkError } = await supabase
      .from('release_notes')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing release notes:', checkError);
      throw checkError;
    }

    if (existing && existing.length > 0) {
      console.log('Release notes already exist. Skipping seed.');
      toast.info('Release notes already populated');
      return { success: true, message: 'Release notes already exist', count: 0 };
    }

    // Insert all release notes (cast tutorial_steps to Json type)
    const notesToInsert = releaseNotesData.map(note => ({
      ...note,
      tutorial_steps: note.tutorial_steps as any, // Cast to match Supabase Json type
    }));

    const { data, error } = await supabase
      .from('release_notes')
      .insert(notesToInsert)
      .select();

    if (error) {
      console.error('Error seeding release notes:', error);
      throw error;
    }

    console.log(`Successfully seeded ${data?.length || 0} release notes`);
    toast.success(`Seeded ${data?.length || 0} release notes`);
    
    return { 
      success: true, 
      message: 'Release notes seeded successfully', 
      count: data?.length || 0 
    };
  } catch (error) {
    console.error('Failed to seed release notes:', error);
    toast.error('Failed to seed release notes');
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error', 
      count: 0 
    };
  }
}

// Function to clear all release notes (for development/testing)
export async function clearReleaseNotes() {
  try {
    const { error } = await supabase
      .from('release_notes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) throw error;

    toast.success('All release notes cleared');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear release notes:', error);
    toast.error('Failed to clear release notes');
    return { success: false };
  }
}
