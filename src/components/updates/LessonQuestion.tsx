import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

const FACES = ['😕', '😐', '🙂', '😍'];

/** "Stuck? Ask a question" at the end of a lesson — goes to Feedback, tagged with the lesson. */
export function LessonQuestion({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [face, setFace] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!text.trim() && !face) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('user_feedback').insert({
      user_id: session?.user.id ?? null,
      feedback_type: 'question',
      category: 'learning',
      subject: `Lesson: ${moduleTitle}`,
      message: text.trim() || `(rated ${face})`,
      emoji_rating: face,
      metadata: { module_id: moduleId },
    });
    setBusy(false);
    if (error) { toast("That didn't send — let's try again in a moment."); return; }
    trackEvent('lesson_question', { module_id: moduleId });
    toast.success("Got it — we'll guide you on your next step 🌿");
    setText(''); setFace(null); setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Stuck? Ask a question</Button>
    );
  }
  return (
    <div className="rounded-xl bg-accent/40 p-3 space-y-2">
      <p className="text-sm font-medium">How did this lesson feel?</p>
      <div className="flex gap-2">
        {FACES.map((f) => (
          <Button key={f} type="button" size="sm" variant={face === f ? 'default' : 'outline'} onClick={() => setFace(f)}>{f}</Button>
        ))}
      </div>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What would you like help with?" />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Not now</Button>
        <Button size="sm" onClick={send} disabled={busy || (!text.trim() && !face)}>Send</Button>
      </div>
    </div>
  );
}
