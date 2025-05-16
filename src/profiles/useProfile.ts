
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
        // Use a raw query instead of RPC to avoid type errors
        const { data, error } = await supabaseClient
          .from('auth.users')
          .select('id, email')
          .eq('id', user.id)
          .single();

        if (error) {
          // If there's an error with the query, create a fallback profile
          console.warn('Error fetching profile, using fallback profile');
          setProfile({
            id: user.id,
            email: user.email || '',
            role: 'user',
            created_at: new Date().toISOString()
          });
          return;
        }
        
        // Transform user data into a profile object
        setProfile({
          id: data.id,
          email: data.email || '',
          role: 'user', // Default role
          created_at: new Date().toISOString()
        });
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
