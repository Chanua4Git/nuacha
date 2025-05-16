
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
        // The issue is here - we need to use a direct raw query instead of a 'from' query
        // since 'profiles' is not in the generated types
        const { data, error } = await supabaseClient
          .rpc('get_profile_by_id', { user_id: user.id })
          .single();

        if (error) {
          // If the RPC method doesn't exist yet, we'll create a simple profile object
          // This is a fallback until we create a proper profiles table
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
            created_at: new Date().toISOString()
          });
          console.warn('Profile RPC not found, using fallback profile');
          return;
        }
        
        setProfile(data as Profile);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err);
        
        // Create a fallback profile from the user object
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
            created_at: new Date().toISOString()
          });
        }
        
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
