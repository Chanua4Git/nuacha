import { supabaseClient } from './supabaseClient';
import { toast } from 'sonner';

// Send people back to the WhatsApp step if they came from an ?add=whatsapp link.
const returnUrl = () => {
  const at = Number(localStorage.getItem('wa_prompt_pending') || 0);
  const pending = at && Date.now() - at < 30 * 60 * 1000;
  return `${window.location.origin}/${pending ? '?add=whatsapp' : ''}`;
};

export const handleGoogleLogin = async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: returnUrl()
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
      redirectTo: returnUrl()
    }
  });
  
  if (error) {
    toast.error("We couldn't connect with Facebook right now. Please try again.");
  }
};
