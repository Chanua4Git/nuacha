import { supabaseClient } from './supabaseClient';
import { toast } from 'sonner';

export const handleGoogleLogin = async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  
  if (error) {
    toast.error("We couldn't connect with Google right now. Please try again.");
  }
};

export const handleFacebookLogin = async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  
  if (error) {
    toast.error("We couldn't connect with Facebook right now. Please try again.");
  }
};
