import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { NUACHA_BANK_DETAILS, NUACHA_WHATSAPP_NUMBER, NUACHA_WIPAY_ME_URL } from "@/constants/nuachaPayment";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { Check, ChevronDown, HeartHandshake, Sparkles, CalendarDays, Copy, CircleHelp, ExternalLink } from "lucide-react";

type Pkg = "hand_holding" | "done_for_you";
const PACKAGES: Record<Pkg, { title: string; price: number; icon: any; blurb: string; points: string[] }> = {
  hand_holding: {
    title: "Hand-holding", price: 100, icon: HeartHandshake,
    blurb: "One guided starting session. You do the steps, with me beside you.",
    points: ["Start your household and people", "Review up to three receipts together", "Try Talk it through", "Leave with clear next steps — not a promise of a finished setup"],
  },
  done_for_you: {
    title: "Done-for-you", price: 300, icon: Sparkles,
    blurb: "Start with onboarding and a plan. I help build your setup over agreed visits.",
    points: ["TT$300 for the initial onboarding session", "Discuss your budget, households, businesses and people", "Start your setup and review up to three receipts", "Agree a task list, tentative visits and a separate follow-up quote"],
  },
};

const makeRef = () => `SETUP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const SETUP_INVOICES: Record<Pkg, string> = {
  hand_holding: "https://tt.wipayfinancial.com/Invoice/view?id=183698&signature=c9ef580c9322efc0b80708e85ca0e649d281064195edbe728423f8f505301c32",
  done_for_you: "https://tt.wipayfinancial.com/Invoice/view?id=183819&signature=ada66b4d0cead373c04eaca5fd7704d61ca28b3929b283317da8555f43b5f239",
};
const IN_PERSON_LOCATIONS = [
  "Starbucks Maraval",
  "Starbucks Brentwood",
  "Starbucks Couva",
  "Starbucks South Park",
  "The Garden Ohm, Freeport",
] as const;

const getCalendarEmbedUrl = (url: string | null) => {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}gv=true`;
};

export default function Setup() {
  const [searchParams] = useSearchParams();
  const requestedPackage = searchParams.get("package");
  const requestedMode = searchParams.get("mode");
  const [pkg, setPkg] = useState<Pkg | null>(requestedPackage === "hand_holding" || requestedPackage === "done_for_you" ? requestedPackage : null);
  const [mode, setMode] = useState<"remote" | "in_person">(requestedMode === "in_person" ? "in_person" : "remote");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [pay, setPay] = useState<"wipay" | "pwyw" | "bank">("wipay");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [ref] = useState(makeRef);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotSaved, setSlotSaved] = useState(false);
  const chosenSlot = slotDate && slotTime
    ? `${new Date(`${slotDate}T${slotTime}`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${new Date(`${slotDate}T${slotTime}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    : "";

  useEffect(() => {
    document.title = "Setup with Nuacha — hand-holding or done-for-you";
    trackEvent("setup_page_view");
    (supabase.from as any)("app_settings").select("value").eq("key", "booking_url").maybeSingle()
      .then(({ data }: any) => setBookingUrl(data?.value || null));
  }, []);

  useEffect(() => {
    const section = searchParams.get("section");
    const targetId = section === "calendar" ? "setup-calendar" : requestedPackage ? "setup-details" : null;
    if (!targetId || deepLinkScrolled.current) return;
    deepLinkScrolled.current = true;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchParams, requestedPackage]);

  const deepLinkScrolled = useRef(false);
  const p = pkg ? PACKAGES[pkg] : null;
  const calendarEmbedUrl = getCalendarEmbedUrl(bookingUrl);

  const scrollToSection = (id: string) => {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };
  const choosePackage = (k: Pkg, target: "plan" | "details") => {
    setPkg(k);
    setDone(null);
    scrollToSection(target === "plan" ? "setup-plan" : "setup-details");
  };

  const submit = async () => {
    if (!pkg || !p) return;
    if (!name.trim()) { toast("Let's add the name you'd like me to use."); return; }
    if (!/^[1-9]\d{6,14}$/.test(whatsapp.replace(/\D/g, ""))) { toast("Please add your full WhatsApp number, including country code — for example +1 868 123 4567."); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast("Please check your email address, or leave it blank."); return; }
    if (mode === "in_person" && !meetingLocation) { toast("Please choose where you'd like to meet."); return; }
    const paymentUrl = pay === "wipay" ? SETUP_INVOICES[pkg] : NUACHA_WIPAY_ME_URL;
    const paymentWindow = pay !== "bank" ? window.open("about:blank", "_blank") : null;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await (supabase.from as any)("setup_requests").insert({
      user_id: session?.user.id ?? null, name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 30),
      email: email.trim().slice(0, 200) || null, package: pkg, amount_ttd: p.price, mode, payment_method: pay,
      meeting_location: mode === "in_person" ? meetingLocation : null,
      chosen_slot: slotSaved ? chosenSlot : null,
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
        <p className="text-muted-foreground max-w-xl mx-auto">Remote by video or in person. Start with a guided session, or let me help organise your setup in manageable stages.</p>
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
          <div><p className="font-medium">Your details & date</p><p className="text-sm text-muted-foreground">Choose your setup, place and time.</p></div>
        </div>
        <span className="hidden text-muted-foreground sm:block" aria-hidden="true">→</span>
        <div className="flex min-h-16 items-center gap-3 rounded-lg border bg-card p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">2</span>
          <div><p className="font-medium">Complete payment</p><p className="text-sm text-muted-foreground">Choose WiPay, pay what you can, or bank transfer.</p></div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">Choose your details and date first, then continue to payment. Your payment and appointment are confirmed separately.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(PACKAGES) as Pkg[]).map((k) => {
          const it = PACKAGES[k]; const Icon = it.icon; const on = pkg === k;
          return (
            <Card key={k} className={`cursor-pointer transition ${on ? "ring-2 ring-primary" : ""}`} onClick={() => choosePackage(k, "plan")}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="text-xl font-playfair">{it.title}</h2></div>
                <p className="text-3xl font-semibold">TT${it.price}</p>
                <p className="text-muted-foreground">{it.blurb}</p>
                <ul className="space-y-1 text-sm">{it.points.map((pt) => <li key={pt} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />{pt}</li>)}</ul>
                <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={(e) => { e.stopPropagation(); choosePackage(k, "plan"); }}>
                  <ChevronDown className="mr-1 h-4 w-4" /> More about {it.title}
                </Button>
                <Button type="button" variant={on ? "default" : "outline"} className="w-full" onClick={(e) => { e.stopPropagation(); choosePackage(k, "details"); }}>{on ? "Chosen — add your details" : `Choose ${it.title}`}</Button>
                <p className="text-center text-xs text-muted-foreground">Tap the card for more details</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pkg && (
        <section id="setup-plan" className="scroll-mt-24 space-y-5 border-y py-6" aria-labelledby="setup-plan-heading">
          {pkg === "hand_holding" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Hand-holding · what your session covers</p>
            <h2 className="text-2xl font-playfair">One guided session, together.</h2>
            <p className="text-muted-foreground">We sit together — remotely by video, or in person at the place you choose — and you do the steps with me beside you.</p>
            <ul className="space-y-1 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />Start your household and add the people in it</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />Review up to three receipts together</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />Try Talk it through — voice or typing</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" />Leave with clear next steps, and book another session whenever you like</li>
            </ul>
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">Bring what you have:</strong> a few receipts, your household or business names, and the people to include. No banking passwords or sign-in codes are needed.</p>
          </div>
          ) : (
          <>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Done-for-you · a staged approach</p>
            <h2 id="setup-plan-heading" className="text-2xl font-playfair">A useful first visit. A clear plan for the rest.</h2>
            <p className="text-muted-foreground">TT$300 covers your initial onboarding and planning session, not a complete financial setup or a series of visits. We start the work together and agree the remaining tasks, timing and price before any follow-up work begins.</p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2">
            {[
              ["1. Understand & start", "Your initial visit: discuss your budget, what you want organised, and your families, homes or businesses. Identify the people belonging to each, start the essentials and review up to three receipts, time and your available scans permitting."],
              ["2. Build the structure", "A separately quoted follow-up: complete the agreed households or business profiles, assign people, organise categories and payment sources, and begin a budget template."],
              ["3. Organise & check", "A separately quoted follow-up: review the budget and recurring costs, check receipt dates, amounts and categories, and work through the prioritised task list. Larger backlogs need a separate plan."],
              ["4. Walk through & hand over", "If needed, a final follow-up: check the agreed setup, practise adding receipts and Talk it through, review your summaries, and leave you with a manageable routine and any remaining tasks."],
            ].map(([title, description]) => (
              <li key={title} className="space-y-2"><h3 className="font-medium">{title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{description}</p></li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">A tentative starting point: 3–4 visits in total.</strong> This is a planning estimate, not a guaranteed completion time or an included package. A simple setup may need fewer visits; multiple homes, businesses or a receipt backlog may need more. We agree visit lengths, priorities and a tentative schedule after onboarding. Remote and in-person visits follow the same agreed task list.</p>
          <div className="space-y-2 border-t pt-4 text-sm">
            <p><strong>Bring what you have:</strong> receipts, household or business names, the people to include, income and regular-cost estimates, and your priorities. No banking passwords or sign-in codes are needed.</p>
            <p className="text-muted-foreground">We review up to three receipts at each visit, within the free plan’s three scans per account per day. If you have already used some scans that day, fewer may be available. After setup, keep going with three free scans daily, or subscribe for unlimited scans. Subscription fees are separate from setup and follow-up visits; unlimited scans do not include unlimited personal support.</p>
          </div>
          </>
          )}
        </section>
      )}

      {p && !done && (
        <Card id="setup-details" className="scroll-mt-24"><CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <p className="font-medium">Where would you like to meet?</p>
            <div className="flex gap-2">
              <Button variant={mode === "remote" ? "default" : "outline"} onClick={() => { setMode("remote"); setMeetingLocation(""); }}>Remote</Button>
              <Button variant={mode === "in_person" ? "default" : "outline"} onClick={() => setMode("in_person")}>In person</Button>
            </div>
          </div>
          {mode === "in_person" && (
            <div className="space-y-2">
              <Label htmlFor="setup-location">Choose your in-person meeting place</Label>
              <Select value={meetingLocation} onValueChange={setMeetingLocation}>
                <SelectTrigger id="setup-location"><SelectValue placeholder="Select a Starbucks or The Garden Ohm" /></SelectTrigger>
                <SelectContent>{IN_PERSON_LOCATIONS.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">We’ll meet at the location you choose here.</p>
            </div>
          )}
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
        </CardContent></Card>
      )}

      <section id="setup-calendar" className="scroll-mt-24 space-y-4" aria-labelledby="setup-calendar-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Choose your date</p>
            <h2 id="setup-calendar-heading" className="text-2xl font-playfair">Pick your date on the calendar</h2>
            <p className="text-sm text-muted-foreground">Choose a time for your {pkg === "done_for_you" ? "initial onboarding" : "starting"} session, complete your details, then continue to payment below.</p>
          </div>
          {bookingUrl && !slotSaved && (
            <Button variant="outline" onClick={openCalendar} className="shrink-0">
              <ExternalLink className="mr-2 h-4 w-4" />Open calendar in a new window
            </Button>
          )}
        </div>
        {slotSaved && chosenSlot ? (
          <div className="rounded-lg border-2 border-primary bg-card p-6 text-center space-y-3">
            <Check className="mx-auto h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-primary">Your booking reminder</p>
            <p className="text-2xl font-playfair">{chosenSlot}</p>
            <p className="text-sm text-muted-foreground">The time you added from your confirmation. Your Google confirmation is the booking record — adding this reminder does not make another booking.</p>
            <Button variant="outline" size="sm" onClick={() => setSlotSaved(false)}>Edit reminder</Button>
            <p className="text-xs text-muted-foreground">Need to reschedule? Use the link in your Google confirmation email.</p>
          </div>
        ) : (<>
        {calendarEmbedUrl ? (
            <div className="overflow-hidden rounded-lg border bg-card">
              <iframe
                src={calendarEmbedUrl}
                title="Choose a date for your Nuacha setup session"
                loading="lazy"
                className="block h-[720px] w-full border-0 sm:h-[760px]"
              />
              <div className="border-t p-3 text-center text-sm text-muted-foreground">
                Calendar not showing? <Button type="button" variant="link" onClick={openCalendar} className="h-auto p-0">Open it in a new window</Button>.
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 text-center space-y-3">
              <CalendarDays className="mx-auto h-6 w-6 text-primary" />
              <p className="text-muted-foreground">The booking calendar is being prepared. Save your request above and we’ll arrange a time with you on WhatsApp.</p>
            </div>
          )}
          {calendarEmbedUrl && (
            <details className="border-t py-4">
              <summary className="cursor-pointer font-medium text-primary">Already booked? Keep your time here</summary>
              <p className="mt-3 text-sm text-muted-foreground">Your Google confirmation is your booking record. Nuacha cannot read the time selected in Google’s calendar. Optionally add the date and time from your confirmation below to keep a reminder with your request — no second booking needed.</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="space-y-1"><Label htmlFor="slot-date">Date</Label><Input id="slot-date" type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="slot-time">Time</Label><Input id="slot-time" type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} /></div>
                <Button disabled={!slotDate || !slotTime} onClick={() => { setSlotSaved(true); trackEvent("setup_slot_chosen"); }}><Check className="mr-2 h-4 w-4" />Keep my booking reminder</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Use the same time zone shown in your Google confirmation.</p>
            </details>
          )}
        </>)}
      </section>

      {p && !done && (
        <Card><CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Step 2</p>
            <h2 className="text-2xl font-playfair">How would you like to pay?</h2>
            {pkg === "done_for_you" && <p className="mt-2 text-sm text-muted-foreground">This payment is for initial onboarding and planning only. Further visits and work are quoted separately and agreed with you first.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={pay === "wipay" ? "default" : "outline"} onClick={() => setPay("wipay")}>WiPay — TT${p.price}</Button>
            <Button variant={pay === "pwyw" ? "default" : "outline"} onClick={() => setPay("pwyw")}>Pay what you can</Button>
            <Button variant={pay === "bank" ? "default" : "outline"} onClick={() => setPay("bank")}>Bank transfer</Button>
          </div>
          <div className="rounded-xl bg-accent/40 p-3 text-sm space-y-1">
            {pay === "wipay" && <p>We'll open the WiPay invoice for <strong>{p.title}{pkg === "done_for_you" ? " onboarding" : ""} · TT${p.price}</strong>. Keep reference <strong>{ref}</strong> with your payment confirmation.</p>}
            {pay === "pwyw" && <p>We'll open WiPay — pay what feels right for you and add reference <strong>{ref}</strong>. Every bit helps.</p>}
            {pay === "bank" && <>
              <p><strong>{NUACHA_BANK_DETAILS.bankName}</strong> · {NUACHA_BANK_DETAILS.accountType}</p>
              <p>Account {NUACHA_BANK_DETAILS.accountNumber} · {NUACHA_BANK_DETAILS.accountHolder}</p>
              <p>Amount <strong>TT${p.price}</strong> · Reference <strong>{ref}</strong>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(ref); toast.success("Reference copied"); }}><Copy className="h-3 w-3" /></Button></p>
            </>}
          </div>
          <Button size="lg" onClick={submit} disabled={busy}>{pay === "bank" ? "I'll transfer — save my request" : "Continue to payment"}</Button>
        </CardContent></Card>
      )}

      {done && p && (
        <Card><CardContent className="p-6 space-y-3 text-center">
          <h2 className="text-2xl font-playfair">Thank you — your request is saved 🌿</h2>
          <p className="text-muted-foreground">Reference <strong>{done}</strong>. Payment and your appointment are confirmed separately.</p>
          {pkg === "done_for_you" && <p className="text-sm text-muted-foreground">Your first appointment is for onboarding and planning. We’ll agree the remaining work, follow-up quote and tentative visit schedule together.</p>}
          {mode === "in_person" && meetingLocation && <p className="text-sm">Meeting place: <strong>{meetingLocation}</strong></p>}
          {pay !== "bank" && pkg && <Button variant="outline" asChild><a href={pay === "wipay" ? SETUP_INVOICES[pkg] : NUACHA_WIPAY_ME_URL} target="_blank" rel="noopener noreferrer">Open payment</a></Button>}
          {slotSaved && chosenSlot ? (
            <div className="mx-auto max-w-sm rounded-lg border bg-accent/40 p-3"><p className="text-sm text-muted-foreground">Booking reminder · from your confirmation</p><p className="font-medium"><CalendarDays className="mr-2 inline h-4 w-4" />{chosenSlot}</p></div>
          ) : bookingUrl ? (
            <p className="text-sm"><a href="#setup-calendar" className="text-primary underline underline-offset-4">Haven't picked a time yet? Choose it on the calendar above.</a></p>
          ) : (
            <Button size="lg" onClick={book}><CalendarDays className="h-4 w-4 mr-2" />Arrange a time on WhatsApp</Button>
          )}
        </CardContent></Card>
      )}
    </div>
  );
}
