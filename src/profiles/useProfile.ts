
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/auth/utils/supabaseClient';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export type Profile = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export const useProfile = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setProfile(data as Profile);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err);
        toast("We had trouble loading your profile", {
          description: "Your information might be incomplete. Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user) {
      fetchProfile();
    } else if (!isAuthLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  return { profile, isLoading, error };
};
