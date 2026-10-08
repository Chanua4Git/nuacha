import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthPreview } from '@/contexts/AuthPreviewContext';
import { loadDraft, type CheckinDraft } from '@/lib/checkinDraft';
import { trackEvent } from '@/lib/analytics';
import VoiceCheckIn from './VoiceCheckIn';

/** Opens the daily "Talk it through" check-in from anywhere in the app. */
export const TALK_EVENT = 'nuacha:talk-it-through';
export const CHECKIN_SAVED_EVENT = 'nuacha:checkin-saved';
export const openTalkItThrough = () => window.dispatchEvent(new Event(TALK_EVENT));

const HIDDEN = ['/login', '/signup', '/reset-password'];

const TalkItThroughLauncher = () => {
  const { user } = useAuthPreview();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [resume, setResume] = useState<CheckinDraft | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  const [famLoaded, setFamLoaded] = useState(false);

  useEffect(() => {
    const h = () => { setOpen(true); if (!user) trackEvent('checkin_open_guest'); };
    window.addEventListener(TALK_EVENT, h);
    return () => window.removeEventListener(TALK_EVENT, h);
  }, [user]);

  // Open directly from a shared link like nuacha.com/?talk=true
  useEffect(() => {
    if (!new URLSearchParams(location.search).get('talk')) return;
    setOpen(true);
    if (!user) trackEvent('checkin_open_guest');
    navigate(location.pathname, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // After signing in, pick up a guest's saved note.
  useEffect(() => {
    if (!user) return;
    const draft = loadDraft();
    if (!draft) return;
    setResume(draft);
    setOpen(true);
    if (new URLSearchParams(location.search).get('resume')) navigate(location.pathname, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from('money_accounts').select('id,name').eq('is_active', true).order('name').then(({ data }) => setAccounts(data ?? []));
    supabase.from('families').select('id,name').order('created_at').then(({ data }) => { setFamilies(data ?? []); setFamLoaded(true); });
  }, [open, user]);

  if (HIDDEN.includes(location.pathname) || location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); if (!user) trackEvent('checkin_open_guest'); }}
        aria-label="Talk it through"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 hover:opacity-90 transition"
      >
        <Mic className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Talk it through</span>
      </button>
      <VoiceCheckIn
        daily
        guest={!user}
        resume={user && resume && famLoaded ? resume : null}
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setResume(null); }}
        accounts={accounts}
        families={families}
        onSaved={(info) => {
          window.dispatchEvent(new Event(CHECKIN_SAVED_EVENT));
          // Take people straight to Expenses so they can see what was just added
          if (info?.expenseIds.length) {
            const q = new URLSearchParams({ tab: 'expenses', new: info.expenseIds.join(',') });
            if (info.familyId) q.set('fam', info.familyId);
            navigate(`/app?${q.toString()}`);
          }
        }}
      />
    </>
  );
};

export default TalkItThroughLauncher;
