import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppUrl } from "@/utils/whatsapp";
import { toast } from "sonner";

type Req = { id: string; name: string; whatsapp: string; email: string | null; package: string; amount_ttd: number; mode: string; payment_method: string; reference: string; status: string; notes: string | null; created_at: string };
const PKG: Record<string, string> = { hand_holding: "Hand-holding", done_for_you: "Done-for-you" };
const PAY: Record<string, string> = { wipay: "WiPay", pwyw: "Pay what you can", bank: "Bank transfer" };

/** Admin: setup session requests + the booking calendar link. */
export function SetupRequestsPanel() {
  const [rows, setRows] = useState<Req[]>([]);
  const [booking, setBooking] = useState("");

  const load = async () => {
    const [{ data }, { data: s }] = await Promise.all([
      (supabase.from as any)("setup_requests").select("*").order("created_at", { ascending: false }),
      (supabase.from as any)("app_settings").select("value").eq("key", "booking_url").maybeSingle(),
    ]);
    setRows(data || []); setBooking(s?.value || "");
  };
  useEffect(() => { load(); }, []);

  const saveBooking = async () => {
    const v = booking.trim();
    if (v && !/^https:\/\//.test(v)) return toast("Please paste the full https:// link.");
    const { error } = await (supabase.from as any)("app_settings").upsert({ key: "booking_url", value: v || null });
    error ? toast("Couldn't save", { description: error.message }) : toast.success("Booking link saved");
  };
  const setStatus = async (id: string, status: string) => {
    await (supabase.from as any)("setup_requests").update({ status }).eq("id", id);
    load();
  };

  return (
    <Card><CardContent className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-playfair">Setup requests</h2>
        <p className="text-sm text-muted-foreground">From nuacha.com/setup. Mark each one paid, booked or done.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Google Calendar booking page link (https://calendar.app.google/…)" value={booking} onChange={(e) => setBooking(e.target.value)} />
        <Button variant="outline" onClick={saveBooking}>Save link</Button>
      </div>
      {!booking && <p className="text-xs text-muted-foreground">Until a link is saved, "Book a time" opens WhatsApp to you.</p>}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet — and that's okay.</p> : rows.map((r) => (
        <div key={r.id} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 text-sm space-y-0.5">
            <div className="font-medium">{r.name} · {PKG[r.package]} TT${r.amount_ttd} · {r.mode === "remote" ? "Remote" : "In person"}</div>
            <div className="text-muted-foreground">{r.whatsapp}{r.email && ` · ${r.email}`} · {PAY[r.payment_method]} · Ref {r.reference} · {format(new Date(r.created_at), "d MMM, h:mm a")}</div>
            {r.notes && <div>“{r.notes}”</div>}
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">{r.status}</Badge>
            <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{["new", "paid", "booked", "done"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => window.open(generateWhatsAppUrl(r.whatsapp, `Hi ${r.name.split(" ")[0]}! Thank you for booking ${PKG[r.package]} setup 🌿 (ref ${r.reference}).`), "_blank")}>WhatsApp</Button>
          </div>
        </div>
      ))}
    </CardContent></Card>
  );
}
