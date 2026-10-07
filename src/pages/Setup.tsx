import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { NUACHA_BANK_DETAILS, NUACHA_WHATSAPP_NUMBER, NUACHA_WIPAY_ME_URL } from "@/constants/nuachaPayment";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { Check, HeartHandshake, Sparkles, CalendarDays, Copy, CircleHelp, ExternalLink } from "lucide-react";

type Pkg = "hand_holding" | "done_for_you";
const PACKAGES: Record<Pkg, { title: string; price: number; icon: any; blurb: string; points: string[] }> = {
  hand_holding: {
    title: "Hand-holding", price: 100, icon: HeartHandshake,
    blurb: "We sit together while you set it up yourself.",
    points: ["Your first scans, together", "Your household and people set up", "Learn Talk it through", "Leave knowing your next steps"],
  },
  done_for_you: {
    title: "Done-for-you", price: 300, icon: Sparkles,
    blurb: "Bring your receipts and family details — we build it for you.",
    points: ["Your receipts scanned for you", "Profile and household built", "A budget template made for your family", "A walkthrough of everything at the end"],
  },
};

const makeRef = () => `SETUP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const SETUP_INVOICES: Record<Pkg, string> = {
  hand_holding: "https://tt.wipayfinancial.com/Invoice/view?id=183698&signature=c9ef580c9322efc0b80708e85ca0e649d281064195edbe728423f8f505301c32",
  done_for_you: "https://tt.wipayfinancial.com/Invoice/view?id=183819&signature=ada66b4d0cead373c04eaca5fd7704d61ca28b3929b283317da8555f43b5f239",
};

export default function Setup() {
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [mode, setMode] = useState<"remote" | "in_person">("remote");
  const [pay, setPay] = useState<"wipay" | "pwyw" | "bank">("wipay");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [ref] = useState(makeRef);

  useEffect(() => {
    document.title = "Setup with Nuacha — hand-holding or done-for-you";
    trackEvent("setup_page_view");
    (supabase.from as any)("app_settings").select("value").eq("key", "booking_url").maybeSingle()
      .then(({ data }: any) => setBookingUrl(data?.value || null));
  }, []);

  const p = pkg ? PACKAGES[pkg] : null;

  const submit = async () => {
    if (!pkg || !p) return;
    if (!name.trim()) { toast("Let's add the name you'd like me to use."); return; }
    if (!/^[1-9]\d{6,14}$/.test(whatsapp.replace(/\D/g, ""))) { toast("Please add your full WhatsApp number, including country code — for example +1 868 123 4567."); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast("Please check your email address, or leave it blank."); return; }
    const paymentUrl = pay === "wipay" ? SETUP_INVOICES[pkg] : NUACHA_WIPAY_ME_URL;
    const paymentWindow = pay !== "bank" ? window.open("about:blank", "_blank") : null;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await (supabase.from as any)("setup_requests").insert({
      user_id: session?.user.id ?? null, name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 30),
      email: email.trim().slice(0, 200) || null, package: pkg, amount_ttd: p.price, mode, payment_method: pay,
      reference: ref, notes: notes.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) { paymentWindow?.close(); toast("That didn't send — let's try again in a moment."); return; }
    trackEvent("setup_request", { package: pkg, payment: pay });
    setDone(ref);
    if (pay !== "bank") {
      if (paymentWindow) { paymentWindow.opener = null; paymentWindow.location.href = paymentUrl; }
      else toast("Your request is saved. Tap Open payment to continue.");
    }
  };

  const book = () => {
    const msg = `Hi Chan! I'd like to arrange ${p?.title} setup (TT$${p?.price}, ${mode === "remote" ? "remote" : "in person"}). Reference ${ref}. Can we confirm payment and a time?`;
    window.open(bookingUrl || `https://wa.me/${NUACHA_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openCalendar = () => {
    if (!bookingUrl) return;
    trackEvent("setup_calendar_open", { source: done ? "confirmation" : "calendar_section" });
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-playfair">Get set up, gently</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Remote or in person. I can hold your hand while you do it, or you bring your receipts and family details and I build it all for you.</p>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Not sure yet? Try it first:</span>
          <Link className="underline" to="/?start=scan">Try a free scan</Link>
          <Link className="underline" to="/updates?tab=learning&module=getting-started">Watch the first lesson</Link>
          <Link className="underline" to="/updates?tab=features">See what's possible</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center" aria-label="Setup booking steps">
        <div className="flex min-h-16 items-center gap-3 rounded-lg border bg-card p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">1</span>
          <div><p className="font-medium">Your details & payment</p><p className="text-sm text-muted-foreground">Choose the help that feels right.</p></div>
        </div>
        <span className="hidden text-muted-foreground sm:block" aria-hidden="true">→</span>
        <div className="flex min-h-16 items-center gap-3 rounded-lg border bg-card p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">2</span>
          <div><p className="font-medium">Pick your date</p><p className="text-sm text-muted-foreground">Choose an available time on the calendar.</p></div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">You can see available times below. Your payment and calendar appointment are confirmed separately.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(PACKAGES) as Pkg[]).map((k) => {
          const it = PACKAGES[k]; const Icon = it.icon; const on = pkg === k;
          return (
            <Card key={k} className={`cursor-pointer transition ${on ? "ring-2 ring-primary" : ""}`} onClick={() => { setPkg(k); setDone(null); }}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="text-xl font-playfair">{it.title}</h2></div>
                <p className="text-3xl font-semibold">TT${it.price}</p>
                <p className="text-muted-foreground">{it.blurb}</p>
                <ul className="space-y-1 text-sm">{it.points.map((pt) => <li key={pt} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />{pt}</li>)}</ul>
                <Button variant={on ? "default" : "outline"} className="w-full">{on ? "Chosen" : `Choose ${it.title}`}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {p && !done && (
        <Card><CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <p className="font-medium">Where would you like to meet?</p>
            <div className="flex gap-2">
              <Button variant={mode === "remote" ? "default" : "outline"} onClick={() => setMode("remote")}>Remote</Button>
              <Button variant={mode === "in_person" ? "default" : "outline"} onClick={() => setMode("in_person")}>In person</Button>
            </div>
          </div>
          <TooltipProvider><div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1"><Label htmlFor="setup-name">Your name</Label><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Name guidance"><CircleHelp className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Use the name you'd like me to call you. Spaces, hyphens and apostrophes are welcome.</TooltipContent></Tooltip></div>
              <Input id="setup-name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1"><Label htmlFor="setup-whatsapp">WhatsApp number</Label><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="WhatsApp number guidance"><CircleHelp className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Include your country code. For Trinidad & Tobago: +1 868 followed by your seven-digit number.</TooltipContent></Tooltip></div>
              <Input id="setup-whatsapp" type="tel" autoComplete="tel" aria-describedby="setup-phone-hint" placeholder="+1 868 123 4567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={30} />
              <p id="setup-phone-hint" className="text-xs text-muted-foreground">Include country code, e.g. +1 868 123 4567.</p>
            </div>
            <div className="space-y-2"><Label htmlFor="setup-email" className="flex items-center h-6">Email (optional)</Label><Input id="setup-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} /></div>
          </div></TooltipProvider>
          <Textarea placeholder="Anything I should know? (family size, what feels hardest)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          <div className="space-y-2">
            <p className="font-medium">How would you like to pay?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant={pay === "wipay" ? "default" : "outline"} onClick={() => setPay("wipay")}>WiPay — TT${p.price}</Button>
              <Button variant={pay === "pwyw" ? "default" : "outline"} onClick={() => setPay("pwyw")}>Pay what you can</Button>
              <Button variant={pay === "bank" ? "default" : "outline"} onClick={() => setPay("bank")}>Bank transfer</Button>
            </div>
            <div className="rounded-xl bg-accent/40 p-3 text-sm space-y-1">
              {pay === "wipay" && <p>We'll open the WiPay invoice for <strong>{p.title} · TT${p.price}</strong>. Keep reference <strong>{ref}</strong> with your payment confirmation.</p>}
              {pay === "pwyw" && <p>We'll open WiPay — pay what feels right for you and add reference <strong>{ref}</strong>. Every bit helps.</p>}
              {pay === "bank" && <>
                <p><strong>{NUACHA_BANK_DETAILS.bankName}</strong> · {NUACHA_BANK_DETAILS.accountType}</p>
                <p>Account {NUACHA_BANK_DETAILS.accountNumber} · {NUACHA_BANK_DETAILS.accountHolder}</p>
                <p>Amount <strong>TT${p.price}</strong> · Reference <strong>{ref}</strong>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(ref); toast.success("Reference copied"); }}><Copy className="h-3 w-3" /></Button></p>
              </>}
            </div>
          </div>
          <Button size="lg" onClick={submit} disabled={busy}>{pay === "bank" ? "I'll transfer — save my spot" : "Continue to payment"}</Button>
        </CardContent></Card>
      )}

      {done && p && (
        <Card><CardContent className="p-6 space-y-3 text-center">
          <h2 className="text-2xl font-playfair">Thank you — your request is saved 🌿</h2>
          <p className="text-muted-foreground">Reference <strong>{done}</strong>. Payment and your appointment are confirmed separately.</p>
          {pay !== "bank" && pkg && <Button variant="outline" asChild><a href={pay === "wipay" ? SETUP_INVOICES[pkg] : NUACHA_WIPAY_ME_URL} target="_blank" rel="noopener noreferrer">Open payment</a></Button>}
          <Button size="lg" onClick={book}><CalendarDays className="h-4 w-4 mr-2" />{bookingUrl ? "Pick or confirm your date" : "Arrange a time on WhatsApp"}</Button>
        </CardContent></Card>
      )}

      <section className="space-y-4" aria-labelledby="setup-calendar-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Step 2</p>
            <h2 id="setup-calendar-heading" className="text-2xl font-playfair">Pick your date on the calendar</h2>
            <p className="text-sm text-muted-foreground">Choose a time that works for you. Please also complete your details and payment above.</p>
          </div>
          {bookingUrl && (
            <Button variant="outline" onClick={openCalendar} className="shrink-0">
              <ExternalLink className="mr-2 h-4 w-4" />Open calendar in a new window
            </Button>
          )}
        </div>
        {bookingUrl ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <iframe
              src={bookingUrl}
              title="Choose a date for your Nuacha setup session"
              loading="lazy"
              className="block h-[720px] w-full border-0 sm:h-[760px]"
            />
            <div className="border-t p-3 text-center text-sm text-muted-foreground">
              Calendar not showing? <button type="button" onClick={openCalendar} className="font-medium text-primary underline underline-offset-4">Open it in a new window</button>.
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <CalendarDays className="mx-auto h-6 w-6 text-primary" />
            <p className="text-muted-foreground">The booking calendar is being prepared. Save your request above and we’ll arrange a time with you on WhatsApp.</p>
          </div>
        )}
      </section>
    </div>
  );
}
