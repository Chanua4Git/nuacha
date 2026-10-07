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
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

type Req = { id: string; name: string; whatsapp: string; email: string | null; package: string; amount_ttd: number; mode: string; chosen_slot?: string | null; meeting_location: string | null; payment_method: string; reference: string; status: string; notes: string | null; created_at: string };
const PKG: Record<string, string> = { hand_holding: "Hand-holding", done_for_you: "Done-for-you" };
const PAY: Record<string, string> = { wipay: "WiPay", pwyw: "Pay what you can", bank: "Bank transfer" };

/** Admin: setup session requests + the booking calendar link. */
export function SetupRequestsPanel() {
  const [rows, setRows] = useState<Req[]>([]);
  const [booking, setBooking] = useState("");
  const [deleting, setDeleting] = useState<Req | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data, error }, { data: s }] = await Promise.all([
      (supabase.from as any)("setup_requests").select("*").order("created_at", { ascending: false }),
      (supabase.from as any)("app_settings").select("value").eq("key", "booking_url").maybeSingle(),
    ]);
    if (error) toast("Couldn't load setup requests", { description: error.message });
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
    const { error } = await (supabase.from as any)("setup_requests").update({ status }).eq("id", id);
    if (error) return toast("Couldn't update request", { description: error.message });
    toast.success("Request updated");
    load();
  };
  const deleteRequest = async () => {
    if (!deleting) return;
    setBusy(true);
    const { error } = await (supabase.from as any)("setup_requests").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) return toast("Couldn't delete request", { description: error.message });
    setDeleting(null); toast.success("Request deleted"); load();
  };

  return (
    <Card><CardContent className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-playfair">Setup requests</h2>
        <p className="text-sm text-muted-foreground">From nuacha.com/setup. Confirm payment, mark appointments booked or done, or cancel a request. Calendar appointments are managed in your calendar separately.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Google Calendar booking page link (https://calendar.app.google/…)" value={booking} onChange={(e) => setBooking(e.target.value)} />
        <Button variant="outline" onClick={saveBooking}>Save link</Button>
      </div>
      {!booking && <p className="text-xs text-muted-foreground">Until a link is saved, "Book a time" opens WhatsApp to you.</p>}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet — and that's okay.</p> : rows.map((r) => (
        <div key={r.id} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0 break-words text-sm space-y-0.5">
            <div className="font-medium">{r.name} · {PKG[r.package]} TT${r.amount_ttd} · {r.mode === "remote" ? "Remote" : `In person${r.meeting_location ? ` · ${r.meeting_location}` : ""}`}</div>
            {r.chosen_slot && <div className="text-sm">Chosen time: <strong>{r.chosen_slot}</strong></div>}
            <div className="text-muted-foreground">{r.whatsapp}{r.email && ` · ${r.email}`} · {PAY[r.payment_method]} · Ref {r.reference} · {format(new Date(r.created_at), "d MMM, h:mm a")}</div>
            {r.notes && <div>“{r.notes}”</div>}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">{r.status}</Badge>
            <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{["new", "paid", "booked", "done", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => window.open(generateWhatsAppUrl(r.whatsapp, `Hi ${r.name.split(" ")[0]}! Thank you for booking ${PKG[r.package]} setup${r.meeting_location ? ` at ${r.meeting_location}` : ""} 🌿 (ref ${r.reference}).`), "_blank")}>WhatsApp</Button>
            <Button size="icon" variant="ghost" aria-label={`Delete request ${r.reference}`} title="Delete request" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && !busy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this setup request?</AlertDialogTitle><AlertDialogDescription>{deleting?.name} · {deleting?.reference}. This permanently removes the request. It does not refund a payment or remove a calendar appointment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep request</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={deleteRequest}>{busy ? "Deleting…" : "Delete request"}</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent></Card>
  );
}
