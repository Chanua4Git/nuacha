import { useEffect, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Mic, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { openTalkItThrough, CHECKIN_SAVED_EVENT } from './TalkItThroughLauncher';

/** Small, gentle prompt to do today's check-in. */
const DailyCheckInCard = () => {
  const [last, setLast] = useState<string | null | undefined>(undefined);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from('profiles').select('last_checkin_at').eq('id', user.id).maybeSingle();
    setLast(data?.last_checkin_at ?? null);
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener(CHECKIN_SAVED_EVENT, h);
    return () => window.removeEventListener(CHECKIN_SAVED_EVENT, h);
  }, []);

  if (last === undefined) return null;
  const days = last ? differenceInCalendarDays(new Date(), parseISO(last)) : null;
  const done = days === 0;

  return (
    <div className="mb-6 rounded-2xl border bg-accent/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="font-serif text-lg flex items-center gap-2">
          {done ? <><CheckCircle2 className="h-5 w-5 text-primary" /> All caught up for today</> : days !== null && days >= 2 ? "It's been a couple of days. Want to catch up?" : 'How did today go?'}
        </p>
        <p className="text-sm text-muted-foreground">
          Say what you spent or took out, add any receipts, and I'll sort it into entries for you to check.
        </p>
      </div>
      <Button variant={done ? 'outline' : 'default'} onClick={openTalkItThrough}>
        <Mic className="h-4 w-4 mr-1" /> {done ? 'Add more' : 'Talk it through'}
      </Button>
    </div>
  );
};

export default DailyCheckInCard;
