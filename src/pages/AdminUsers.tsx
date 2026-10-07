import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { useAdminRole } from "@/hooks/useAdminRole";
import { generateWhatsAppUrl } from "@/utils/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Circle, MessageCircle, Mail, Loader2, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

type Journey = {
  user_id: string; email: string; phone: string | null; provider: string;
  joined_at: string; last_sign_in_at: string | null; family_count: number;
  total_scans: number; scans_today: number; best_day_scans: number; expense_count: number;
  last_nudge_at: string | null; nudge_count: number;
};
type Template = { id: string; name: string; stage: string; channel: string; message: string };

const stageOf = (j: Journey) => {
  if (!j.phone) return "needs_phone";
  if (j.family_count === 0) return "no_household";
  if (j.total_scans === 0 && j.expense_count === 0) return "no_scan";
  if (j.best_day_scans < 3) return "under_three";
  return "done";
};
const STAGE_LABEL: Record<string, string> = {
  needs_phone: "Needs phone", no_household: "No household yet", no_scan: "Hasn't scanned",
  under_three: "Under 3 scans in a day", done: "Reached 3 scans 🎉",
};
const firstName = (email: string) => {
  const n = email.split("@")[0].replace(/[0-9._-]+/g, " ").trim().split(" ")[0] || "there";
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export default function AdminUsers() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const [rows, setRows] = useState<Journey[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [nudging, setNudging] = useState<Journey | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Template | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: j, error }, { data: t }] = await Promise.all([
      (supabase.rpc as any)("admin_user_journeys"),
      (supabase.from as any)("nudge_templates").select("*").order("created_at"),
    ]);
    if (error) toast("Couldn't load users", { description: error.message });
    setRows((j as Journey[]) || []);
    setTemplates((t as Template[]) || []);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = stageOf(r);
    if (filter === "stuck") return s === "no_scan" || s === "no_household";
    if (filter === "phone") return !r.phone;
    if (filter === "week") return Date.now() - new Date(r.joined_at).getTime() < 7 * 864e5;
    if (filter === "done") return s === "done";
    return true;
  }), [rows, filter]);

  if (roleLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const fill = (tpl: string, j: Journey) =>
    tpl.replace(/\[Name\]/g, firstName(j.email)).replace(/\[X\]/g, String(j.scans_today));

  const openNudge = (j: Journey) => {
    const s = stageOf(j);
    const tpl = templates.find((t) => t.stage === s) || templates.find((t) => t.stage === "re_engagement") || templates[0];
    setNudging(j);
    setTemplateId(tpl?.id || "");
    setMessage(tpl ? fill(tpl.message, j) : "");
  };

  const send = async (channel: "whatsapp" | "email") => {
    if (!nudging || !user) return;
    if (channel === "whatsapp" && nudging.phone) {
      window.open(generateWhatsAppUrl(nudging.phone, message), "_blank");
    } else {
      window.open(`mailto:${nudging.email}?subject=${encodeURIComponent("A gentle hello from Nuacha 🌿")}&body=${encodeURIComponent(message)}`, "_blank");
    }
    await (supabase.from as any)("admin_communications").insert({
      admin_id: user.id, target_user_id: nudging.user_id, template_id: templateId || null, channel, message,
    });
    toast.success("Nudge logged");
    setNudging(null);
    load();
  };

  const saveTemplate = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const q = id ? (supabase.from as any)("nudge_templates").update(rest).eq("id", id)
                 : (supabase.from as any)("nudge_templates").insert(rest);
    const { error } = await q;
    if (error) return toast("Couldn't save", { description: error.message });
    setEditing(null); load();
  };

  const steps = (j: Journey) => [
    { label: "Account", ok: true },
    { label: "Phone", ok: !!j.phone },
    { label: "Household", ok: j.family_count > 0 },
    { label: "First scan", ok: j.total_scans > 0 || j.expense_count > 0 },
    { label: "3 in a day", ok: j.best_day_scans >= 3 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-playfair">New sign-ups</h1>
          <p className="text-muted-foreground">See where each person is and gently help them to their first three scans.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" onClick={async () => {
          const t = templates.find((x) => x.stage === 'share');
          const text = t?.message || 'Try your first Nuacha scan: https://nuacha.com/?start=scan&ref=share';
          if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* fall through */ } }
          await navigator.clipboard.writeText(text);
          toast.success("Share message copied", { description: "Paste it into WhatsApp, Facebook or Instagram." });
        }}><Share2 className="h-4 w-4 mr-1" />Share first-scan link</Button>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone ({rows.length})</SelectItem>
            <SelectItem value="stuck">Stuck (no scan yet)</SelectItem>
            <SelectItem value="phone">Missing phone</SelectItem>
            <SelectItem value="week">Joined last 7 days</SelectItem>
            <SelectItem value="done">Reached 3 scans</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {filtered.map((j) => {
            const s = stageOf(j);
            return (
              <Card key={j.user_id}>
                <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-medium break-all">{j.email}</div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
                      <span>{j.phone || "No phone"}</span>
                      <span>via {j.provider === "google" ? "Google" : "Email"}</span>
                      <span>Joined {format(new Date(j.joined_at), "d MMM, h:mm a")}</span>
                      {j.last_sign_in_at && <span>Active {formatDistanceToNow(new Date(j.last_sign_in_at))} ago</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {steps(j).map((st) => (
                        <span key={st.label} className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${st.ok ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {st.ok ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}{st.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <Badge variant={s === "done" ? "secondary" : "outline"}>
                      {s === "under_three" ? `Best day: ${j.best_day_scans} of 3 · today ${j.scans_today}` : STAGE_LABEL[s]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {j.last_nudge_at ? `Nudged ${formatDistanceToNow(new Date(j.last_nudge_at))} ago (${j.nudge_count})` : "Not nudged yet"}
                    </span>
                    <Button size="sm" onClick={() => openNudge(j)} disabled={s === "done" && templates.length === 0}>Nudge</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nothing here — and that's okay.</p>}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Nudge messages</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditing({ id: "", name: "", stage: "manual", channel: "both", message: "" })}>Add message</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Use [Name] for their first name and [X] for today's scan count.</p>
          {templates.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 border rounded-lg p-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{t.name} <span className="text-muted-foreground font-normal">· {STAGE_LABEL[t.stage] || t.stage}</span></div>
                <p className="text-sm text-muted-foreground">{t.message}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!nudging} onOpenChange={(o) => !o && setNudging(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Nudge {nudging && firstName(nudging.email)}</DialogTitle></DialogHeader>
          <Select value={templateId} onValueChange={(id) => { setTemplateId(id); const t = templates.find((x) => x.id === id); if (t && nudging) setMessage(fill(t.message, nudging)); }}>
            <SelectTrigger><SelectValue placeholder="Choose a message" /></SelectTrigger>
            <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(message); toast.success("Copied — paste it anywhere"); }}><Copy className="h-4 w-4 mr-1" />Copy</Button>
            <Button variant="outline" onClick={() => send("email")}><Mail className="h-4 w-4 mr-1" />Email</Button>
            <Button onClick={() => send("whatsapp")} disabled={!nudging?.phone}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit message" : "New message"}</DialogTitle></DialogHeader>
          {editing && (<>
            <Input placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Select value={editing.stage} onValueChange={(v) => setEditing({ ...editing, stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["needs_phone", "no_household", "no_scan", "under_three", "re_engagement", "share", "manual"].map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s] || s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea rows={5} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} />
            <Button onClick={saveTemplate} disabled={!editing.name || !editing.message}>Save</Button>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
