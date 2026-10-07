import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { NUACHA_BANK_DETAILS, NUACHA_WHATSAPP_NUMBER, NUACHA_WIPAY_ME_URL } from "@/constants/nuachaPayment";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { Check, HeartHandshake, Sparkles, CalendarDays, Copy } from "lucide-react";

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
    if (!name.trim() || whatsapp.replace(/\D/g, "").length < 7) { toast("Let's add your name and WhatsApp number first."); return; }
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await (supabase.from as any)("setup_requests").insert({
      user_id: session?.user.id ?? null, name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 30),
      email: email.trim().slice(0, 200) || null, package: pkg, amount_ttd: p.price, mode, payment_method: pay,
      reference: ref, notes: notes.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) { toast("That didn't send — let's try again in a moment."); return; }
    trackEvent("setup_request", { package: pkg, payment: pay });
    setDone(ref);
    if (pay !== "bank") window.open(NUACHA_WIPAY_ME_URL, "_blank");
  };

  const book = () => {
    const msg = `Hi Chan! I've paid for ${p?.title} setup (TT$${p?.price}, ${mode === "remote" ? "remote" : "in person"}). Reference ${ref}. When can we book?`;
    window.open(bookingUrl || `https://wa.me/${NUACHA_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
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
          <div className="grid md:grid-cols-3 gap-3">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            <Input placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={30} />
            <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
          </div>
          <Textarea placeholder="Anything I should know? (family size, what feels hardest)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          <div className="space-y-2">
            <p className="font-medium">How would you like to pay?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant={pay === "wipay" ? "default" : "outline"} onClick={() => setPay("wipay")}>WiPay — TT${p.price}</Button>
              <Button variant={pay === "pwyw" ? "default" : "outline"} onClick={() => setPay("pwyw")}>Pay what you can</Button>
              <Button variant={pay === "bank" ? "default" : "outline"} onClick={() => setPay("bank")}>Bank transfer</Button>
            </div>
            <div className="rounded-xl bg-accent/40 p-3 text-sm space-y-1">
              {pay === "wipay" && <p>We'll open WiPay — enter <strong>TT${p.price}</strong> and add reference <strong>{ref}</strong>.</p>}
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
          <h2 className="text-2xl font-playfair">Thank you — your spot is saved 🌿</h2>
          <p className="text-muted-foreground">Reference <strong>{done}</strong>. Once you've paid, pick a time that suits you.</p>
          <Button size="lg" onClick={book}><CalendarDays className="h-4 w-4 mr-2" />Book a time</Button>
        </CardContent></Card>
      )}
    </div>
  );
}
