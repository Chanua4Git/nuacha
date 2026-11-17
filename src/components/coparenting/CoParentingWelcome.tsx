import { Link } from 'react-router-dom';
import { Feather, CalendarCheck, PhoneCall, Wallet, FileText, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CoParentingDisclaimer() {
  return (
    <aside className="mx-auto max-w-3xl rounded-2xl border bg-card/80 p-5 text-center shadow-sm print:hidden">
      <p className="text-sm leading-relaxed text-foreground">✨ Your privacy matters to us. Everything you log stays private to your account, handled with care and gentleness. Take your time, breathe, and let us help you keep a calm record during a difficult season.</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">💡 Please note: Nuacha is a logging and documentation tool, not legal advice. It helps you keep peace and sanity by recording facts in one place. For guidance on your situation, please speak with a qualified attorney or family court officer.</p>
    </aside>
  );
}

const cards = [
  { icon: CalendarCheck, title: 'Timeline', body: 'Note what happened and when, in plain words. Mark what matters most.' },
  { icon: PhoneCall, title: 'Access & calls', body: 'Tick off scheduled calls and visits so patterns are easy to see.' },
  { icon: Wallet, title: 'Maintenance', body: 'Track amounts due and received, month by month, without the mental load.' },
  { icon: FileText, title: 'Calm summary', body: 'Turn your own records into a clear summary you can print or share.' },
];

export function CoParentingWelcome({ signedIn, onStart }: { signedIn: boolean; onStart?: () => void }) {
  const cta = signedIn
    ? <Button size="lg" className="rounded-2xl" onClick={onStart}>Start my private log <ArrowRight className="ml-2 h-4 w-4" /></Button>
    : <Button size="lg" className="rounded-2xl" asChild><Link to="/signup">Start my private log <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>;
  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-secondary/60 via-background to-accent/40 px-6 py-12 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary"><Feather className="h-6 w-6 text-primary" /></div>
        <h1 className="font-heading text-3xl md:text-4xl">Begin your journey to steady, peaceful records</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Take a gentle first step. Log one moment today and watch it become an organised, calm timeline you can rely on — whenever you need it.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {cta}
          {!signedIn && <Button size="lg" variant="outline" className="rounded-2xl" asChild><Link to="/login">I already have an account</Link></Button>}
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Private to you. People appear by role only. Share read-only, only if you choose.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(c => (
          <div key={c.title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <c.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-heading text-xl">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
      <CoParentingDisclaimer />
    </section>
  );
}
