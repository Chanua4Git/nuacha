import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const db = supabase as any;
const ROLE_OPTS = ['Mother', 'Father', 'Grandparent', 'Other guardian', 'Prefer not to say'];
const OTHER_OPTS = ['Father', 'Mother', 'Grandparent', 'Guardian', 'Other parent'];
const COUNTRIES = ['Trinidad', 'Tobago', 'Jamaica', 'Barbados', 'Guyana', 'Other Caribbean', 'Canada', 'United States', 'United Kingdom', 'Other'];
const LIVES = ['With you', 'With the other parent', 'Shared', 'A relative', 'It changes'];
const MAINT = ['You pay', 'You receive', 'Neither yet', 'Shared costs only'];
export const STAGES: [string, string][] = [
  ['Just separated, no agreement yet', "Start logging care, costs and contact, so you're ready if you need court later."],
  ['Informal agreement', 'Record what was agreed by word or message, then track it.'],
  ['Lawyer letters or mediation', 'Record proposals from each side.'],
  ['Court case filed, no final order', 'Add interim orders, hearing dates and reports.'],
  ['Final order in place', 'The app tracks against what the order says.'],
  ['Order in place, applying to vary or enforce', 'Track compliance and changes.'],
];

type Child = { name: string; birth_year: string };
function Pick({ value, options, onChange }: { value?: string; options: string[]; onChange: (v: string) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map(o => <button type="button" key={o} aria-pressed={value === o} onClick={() => onChange(o)} className={`rounded-full border px-3 py-1.5 text-sm ${value === o ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}>{o}</button>)}</div>;
}

export function Onboarding({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<any>({ children: [{ name: '', birth_year: '' }] as Child[] });
  const set = (k: string, v: any) => setA((p: any) => ({ ...p, [k]: v }));
  const steps = [
    { t: 'Who are you?', body: <div className="space-y-4">
      <div className="space-y-2"><p className="text-sm font-medium">Your role</p><Pick value={a.my_role} options={ROLE_OPTS} onChange={v => set('my_role', v)} /></div>
      <div className="space-y-2"><p className="text-sm font-medium">The child's other parent or carer is</p><Pick value={a.other_role} options={OTHER_OPTS} onChange={v => set('other_role', v)} /></div>
      <div className="space-y-2"><p className="text-sm font-medium">Where you live</p><Pick value={a.my_country} options={COUNTRIES} onChange={v => set('my_country', v)} /></div>
      <div className="space-y-2"><p className="text-sm font-medium">Where they live</p><Pick value={a.other_country} options={COUNTRIES} onChange={v => set('other_country', v)} /></div>
    </div> },
    { t: 'The children', body: <div className="space-y-3">
      <p className="text-sm text-muted-foreground">A first name or nickname and birth year is enough. No full birth dates.</p>
      {(a.children as Child[]).map((c, i) => <div key={i} className="flex gap-2"><Input placeholder="Nickname" value={c.name} onChange={e => set('children', a.children.map((x: Child, j: number) => j === i ? { ...x, name: e.target.value.slice(0, 40) } : x))} /><Input className="w-32" inputMode="numeric" placeholder="Birth year" value={c.birth_year} onChange={e => set('children', a.children.map((x: Child, j: number) => j === i ? { ...x, birth_year: e.target.value.replace(/\D/g, '').slice(0, 4) } : x))} /></div>)}
      <Button type="button" variant="outline" size="sm" onClick={() => set('children', [...a.children, { name: '', birth_year: '' }])}>Add another child</Button>
    </div> },
    { t: 'Day-to-day care', body: <div className="space-y-4">
      <div className="space-y-2"><p className="text-sm font-medium">The child lives most of the time</p><Pick value={a.lives_with} options={LIVES} onChange={v => set('lives_with', v)} /></div>
      <div className="space-y-2"><p className="text-sm font-medium">Maintenance</p><Pick value={a.maintenance} options={MAINT} onChange={v => set('maintenance', v)} /></div>
    </div> },
    { t: 'Where things stand', body: <div className="space-y-2">{STAGES.map(([s, d]) => <button type="button" key={s} aria-pressed={a.stage === s} onClick={() => set('stage', s)} className={`block w-full rounded-lg border p-3 text-left ${a.stage === s ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'}`}><span className="font-medium">{s}</span><span className="block text-sm text-muted-foreground">{d}</span></button>)}</div> },
    { t: 'A private safety check', body: <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Only you see this answer. It is never shown to anyone you share with.</p>
      <p className="text-sm font-medium">Are you worried about your safety or your child's safety with the other parent?</p>
      <Pick value={a.safety_concern} options={['Yes', 'No', 'Prefer not to say']} onChange={v => set('safety_concern', v)} />
      {a.safety_concern === 'Yes' && <div className="rounded-lg border bg-muted/40 p-3 text-sm">Sharing stays off and we won't suggest inviting the other parent. In Trinidad and Tobago, police emergency: <b>999</b>. Domestic violence hotline: <b>800-SAVE (7283)</b>. If you are in danger now, please call for help first.</div>}
    </div> },
    { t: "How you'll use it", body: <div className="space-y-4">
      <div className="space-y-2"><p className="text-sm font-medium">Start</p><Pick value={a.start_mode} options={['Fresh from today', "Rebuild past history — I'm starting late"]} onChange={v => set('start_mode', v)} /></div>
      {a.safety_concern !== 'Yes' && <div className="space-y-2"><p className="text-sm font-medium">Share with the other parent</p><Pick value={a.invite_pref} options={['Not now', 'Maybe later', 'Never']} onChange={v => set('invite_pref', v)} /><p className="text-xs text-muted-foreground">Sharing is always optional and off unless you turn it on.</p></div>}
    </div> },
  ];
  async function finish() {
    const children = (a.children as Child[]).filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), birth_year: c.birth_year }));
    const row = { user_id: userId, my_role: a.my_role || null, other_role: a.other_role || null, my_country: a.my_country || null, other_country: a.other_country || null, children, lives_with: a.lives_with || null, maintenance: a.maintenance || null, stage: a.stage || null, safety_concern: a.safety_concern || null, start_mode: a.start_mode || null, invite_pref: a.safety_concern === 'Yes' ? 'Never' : (a.invite_pref || null), onboarded_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const r = await db.from('coparenting_profile').upsert(row);
    const mine = a.my_role && a.my_role !== 'Prefer not to say' ? a.my_role : 'You';
    const r2 = await db.from('coparenting_display').upsert({ user_id: userId, my_role: mine, other_role: a.other_role || 'Other parent', updated_at: new Date().toISOString() });
    if (r.error || r2.error) { toast.error('Not saved. Please try again.'); return; }
    toast.success("All set. Your log is ready when you are."); onDone();
  }
  const s = steps[step];
  return <section className="mx-auto max-w-xl space-y-5 rounded-xl border bg-card p-6">
    <div className="space-y-1"><p className="text-xs uppercase tracking-wider text-muted-foreground">Set up your log · step {step + 1} of {steps.length}</p><h2 className="font-heading text-2xl">{s.t}</h2></div>
    {s.body}
    <div className="flex items-center justify-between gap-2 pt-2">
      <Button variant="ghost" onClick={() => step ? setStep(step - 1) : finish()}>{step ? 'Back' : 'Skip for now'}</Button>
      <div className="flex gap-2">{step < steps.length - 1 && <Button variant="outline" onClick={() => setStep(step + 1)}>Skip</Button>}<Button onClick={() => step < steps.length - 1 ? setStep(step + 1) : finish()}>{step < steps.length - 1 ? 'Next' : 'Start my log'}</Button></div>
    </div>
    <p className="text-xs text-muted-foreground">Everything here is private to your account and can be changed later. General information, not legal advice.</p>
  </section>;
}
