import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/lib/analytics';

const redirect = () => `${window.location.origin}/?resume=checkin`;

/** Sign in or sign up inline, so a guest's check-in note can continue. */
const GuestAuthStep = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const checkEmail = async () => {
    if (!/\S+@\S+\.\S+/.test(email)) return;
    const { data } = await supabase.rpc('email_registered', { _email: email.trim() });
    setIsNew(!data);
  };

  const submit = async () => {
    if (!email || password.length < 6) { toast('Please add your email and a password of at least 6 characters.'); return; }
    setBusy(true);
    if (isNew) {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect() } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      trackEvent('checkin_auth_complete', { method: 'signup' });
      if (!data.session) setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) { toast.error("That email and password didn't match. Try again, or switch to “I'm new”."); return; }
      trackEvent('checkin_auth_complete', { method: 'password' });
    }
  };

  const google = async () => {
    trackEvent('checkin_auth_complete', { method: 'google_start' });
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect() } });
  };

  if (sent) return (
    <div className="space-y-3 pt-2">
      <p className="font-medium">Check your email to confirm your account.</p>
      <p className="text-sm text-muted-foreground">Your note is saved on this device. Once you confirm, I'll pick up right where you left off.</p>
      <Button variant="ghost" onClick={onBack}>Back to my note</Button>
    </div>
  );

  return (
    <div className="space-y-3 pt-2">
      <p className="font-medium">Let's keep this safe for you.</p>
      <p className="text-sm text-muted-foreground">Sign in or create a free account. Your note will be waiting.</p>
      <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
      <div className="text-center text-xs text-muted-foreground">or with email</div>
      <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setIsNew(null); }} onBlur={checkEmail} />
      <Input type="password" autoComplete={isNew ? 'new-password' : 'current-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" variant={isNew === false ? 'default' : 'outline'} onClick={() => setIsNew(false)}>I have an account</Button>
        <Button size="sm" variant={isNew ? 'default' : 'outline'} onClick={() => setIsNew(true)}>I'm new</Button>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={submit} disabled={busy || isNew === null}>{busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{isNew ? 'Create account' : 'Sign in'}</Button>
      </div>
    </div>
  );
};

export default GuestAuthStep;
