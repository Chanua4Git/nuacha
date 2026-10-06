import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthPreview } from '@/contexts/AuthPreviewContext';
import VoiceCheckIn from './VoiceCheckIn';

/** Opens the daily "Talk it through" check-in from anywhere in the app. */
export const TALK_EVENT = 'nuacha:talk-it-through';
export const CHECKIN_SAVED_EVENT = 'nuacha:checkin-saved';
export const openTalkItThrough = () => window.dispatchEvent(new Event(TALK_EVENT));

const HIDDEN = ['/login', '/signup', '/reset-password'];

const TalkItThroughLauncher = () => {
  const { user } = useAuthPreview();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(TALK_EVENT, h);
    return () => window.removeEventListener(TALK_EVENT, h);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from('money_accounts').select('id,name').eq('is_active', true).order('name').then(({ data }) => setAccounts(data ?? []));
    supabase.from('families').select('id,name').order('created_at').then(({ data }) => setFamilies(data ?? []));
  }, [open, user]);

  if (!user || HIDDEN.includes(location.pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk it through"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 hover:opacity-90 transition"
      >
        <Mic className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Talk it through</span>
      </button>
      <VoiceCheckIn
        daily
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        families={families}
        onSaved={() => window.dispatchEvent(new Event(CHECKIN_SAVED_EVENT))}
      />
    </>
  );
};

export default TalkItThroughLauncher;
