import { useEffect, useMemo, useState } from "react";
import { learningModules } from "@/constants/learningCenterData";
import { Navigate } from "react-router-dom";
import { formatDistanceToNow, format, isToday } from "date-fns";
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
import { Check, Circle, MessageCircle, Mail, Loader2, Copy, Share2, Users, UserPlus, CircleAlert, MessageSquareText, Search, ChevronDown, ChevronUp, CalendarDays, Clock3, CheckCircle2, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { SetupRequestsPanel } from "@/components/admin/SetupRequestsPanel";

type Journey = {
  user_id: string; email: string; phone: string | null; provider: string;
  joined_at: string; last_sign_in_at: string | null; family_count: number;
  total_scans: number; scans_today: number; best_day_scans: number; expense_count: number;
  last_nudge_at: string | null; nudge_count: number;
  completed_modules?: string[]; last_module?: string | null; last_learning_at?: string | null;
  open_questions?: { module: string; message: string; at: string }[];
  admin_note?: string | null;
};
const nextLesson = (j: Journey) => learningModules.find((m) => !(j.completed_modules || []).includes(m.id)) || null;
const moduleTitle = (id?: string | null) => learningModules.find((m) => m.id === id)?.title || id || "";
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
  learning: "Next lesson", lesson_reply: "Lesson question reply",
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
  const [editUser, setEditUser] = useState<{ j: Journey; phone: string; note: string } | null>(null);
  const [manualNudge, setManualNudge] = useState<{ phone: string; name: string; templateId: string; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const openManualNudge = (template?: Template) => {
    const chosen = template || templates.find((t) => t.name === "Invite to setup") || templates[0];
    setManualNudge({ phone: "", name: "", templateId: chosen?.id || "", message: chosen?.message || "" });
  };
  const manualMessage = manualNudge?.message.replace(/\[Name\]/g, manualNudge.name.trim() || "there") || "";
  const manualDigits = manualNudge?.phone.replace(/\D/g, "") || "";
  const validManualPhone = /^[1-9]\d{6,14}$/.test(manualDigits);

  const load = async () => {
    setLoading(true);
    let [{ data: j, error }, { data: t }, { data: lo }] = await Promise.all([
      (supabase.rpc as any)("admin_user_journeys"),
      (supabase.from as any)("nudge_templates").select("*").order("created_at"),
      (supabase.rpc as any)("admin_learning_overview"),
    ]);
    const { data: notes } = await (supabase.from as any)("profiles").select("id, admin_note");
    const noteBy = new Map(((notes as any[]) || []).map((n) => [n.id, n.admin_note]));
    const byUser = new Map(((lo as any[]) || []).map((r) => [r.user_id, r]));
    j = ((j as Journey[]) || []).map((r) => ({ ...r, ...(byUser.get(r.user_id) || {}), admin_note: noteBy.get(r.user_id) ?? null }));
    if (error) toast("Couldn't load users", { description: error.message });
    setRows((j as Journey[]) || []);
    setTemplates((t as Template[]) || []);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = stageOf(r);
    const query = search.trim().toLowerCase();
    if (query && !`${r.email} ${r.phone || ""} ${r.admin_note || ""}`.toLowerCase().includes(query)) return false;
    if (filter === "stuck") return s === "no_scan" || s === "no_household";
    if (filter === "phone") return !r.phone;
    if (filter === "week") return Date.now() - new Date(r.joined_at).getTime() < 7 * 864e5;
    if (filter === "done") return s === "done";
    return true;
  }), [rows, filter, search]);
  const [showMine, setShowMine] = useState(false);
  const isMine = (j: Journey) => j.email?.toLowerCase().includes("chanuajohnson");
  const mine = filtered.filter(isMine);
  const others = filtered.filter((j) => !isMine(j));

  if (roleLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const fill = (tpl: string, j: Journey) =>
    tpl.replace(/\[Name\]/g, firstName(j.email)).replace(/\[X\]/g, String(j.scans_today))
      .replace(/\[Lesson\]/g, nextLesson(j)?.title || "your next lesson")
      .replace(/\[Link\]/g, `https://nuacha.com/updates?tab=learning${nextLesson(j) ? `&module=${nextLesson(j)!.id}` : ""}`)
      .replace(/\[Question\]/g, j.open_questions?.[0]?.message || "")
      .replace(/\[QuestionLesson\]/g, moduleTitle(j.open_questions?.[0]?.module));

  const openNudge = (j: Journey, stage?: string) => {
    const s = stage || stageOf(j);
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

  const saveUser = async () => {
    if (!editUser) return;
    const phone = editUser.phone.trim();
    if (phone && phone.replace(/\D/g, "").length < 7) return toast("That number looks a little short.");
    const { error } = await (supabase.from as any)("profiles").upsert({ id: editUser.j.user_id, phone_number: phone || null, admin_note: editUser.note.trim() || null });
    if (error) return toast("Couldn't save", { description: error.message });
    toast.success("Saved"); setEditUser(null); load();
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

  const visibleUsers = [...(showMine ? mine : []), ...others];
  const joinedThisWeek = others.filter((j) => Date.now() - new Date(j.joined_at).getTime() < 7 * 864e5).length;
  const joinedToday = others.filter((j) => isToday(new Date(j.joined_at))).length;
  const awaitingAction = others.filter((j) => ["needs_phone", "no_household", "no_scan"].includes(stageOf(j))).length;
  const readyToNudge = others.filter((j) => stageOf(j) !== "done").length;
  const nextAction = (j: Journey) => {
    const stage = stageOf(j);
    if (stage === "needs_phone") return "Ask for WhatsApp";
    if (stage === "no_household") return "Guide household setup";
    if (stage === "no_scan") return "Invite first scan";
    if (stage === "under_three") return "Encourage the next scan";
    return "Celebrate their progress";
  };
  const latestActivity = (j: Journey) => j.last_learning_at || j.last_sign_in_at || j.joined_at;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-[1440px] space-y-7 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-5 border-b pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Admin workspace</p>
            <h1 className="text-3xl font-playfair md:text-4xl">User journey</h1>
            <p className="max-w-2xl text-muted-foreground">See who has joined, where they paused, and the gentlest next step to help them move forward.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => openManualNudge()}><MessageCircle className="h-4 w-4" />Nudge a number</Button>
          <Button variant="outline" onClick={async () => {
          const t = templates.find((x) => x.stage === 'share');
          const text = t?.message || 'Try your first Nuacha scan: https://nuacha.com/?start=scan&ref=share';
          if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* fall through */ } }
          await navigator.clipboard.writeText(text);
          toast.success("Share message copied", { description: "Paste it into WhatsApp, Facebook or Instagram." });
          }}><Share2 className="h-4 w-4" />Share first-scan link</Button>
          </div>
        </div>
        <nav className="flex gap-6 text-sm font-medium" aria-label="Admin sections">
          <span className="border-b-2 border-primary pb-3 text-foreground">New sign-ups</span>
          <button type="button" className="pb-3 text-muted-foreground hover:text-foreground" onClick={() => document.getElementById('setup-requests')?.scrollIntoView({ behavior: 'smooth' })}>Setup requests</button>
        </nav>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" aria-label="Sign-up summary">
        {[
          { label: "Signed up today", value: joinedToday, icon: CalendarDays, note: "Newest at the top of the list" },
          { label: "Total sign-ups", value: others.length, icon: Users, note: "Excludes your test accounts" },
          { label: "New this week", value: joinedThisWeek, icon: UserPlus, note: "Joined in the last 7 days" },
          { label: "Awaiting action", value: awaitingAction, icon: CircleAlert, note: "Missing a key first step" },
          { label: "Ready to nudge", value: readyToNudge, icon: MessageSquareText, note: "A next message is available" },
        ].map((item) => (
          <Card key={item.label} className="rounded-lg shadow-sm">
            <CardContent className="flex items-start justify-between p-4">
              <div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div>
              <div className="rounded-md bg-primary/10 p-2 text-primary"><item.icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit {editUser?.j.email}</DialogTitle></DialogHeader>
          <Input placeholder="WhatsApp number, e.g. +1 868 123 4567" value={editUser?.phone || ""} onChange={(e) => editUser && setEditUser({ ...editUser, phone: e.target.value })} maxLength={30} />
          <Textarea placeholder="Private note (only admins see this)" value={editUser?.note || ""} onChange={(e) => editUser && setEditUser({ ...editUser, note: e.target.value })} maxLength={1000} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button><Button onClick={saveUser}>Save</Button></div>
        </DialogContent>
      </Dialog>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email, phone, or note" className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone ({rows.length})</SelectItem>
                <SelectItem value="stuck">Needs a first step</SelectItem>
                <SelectItem value="phone">Missing phone</SelectItem>
                <SelectItem value="week">Joined last 7 days</SelectItem>
                <SelectItem value="done">Reached 3 scans</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" aria-label="Refresh sign-ups" title="Refresh sign-ups" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="space-y-2">
          {mine.length > 0 && (
            <Button variant="outline" className="w-full justify-between rounded-lg bg-background" onClick={() => setShowMine(!showMine)}>
              <span>My accounts (chanuajohnson) · {mine.length}</span>
              {showMine ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          {visibleUsers.map((j) => {
            const s = stageOf(j);
            const isExpanded = expandedUser === j.user_id;
            const lesson = nextLesson(j);
            return (
              <Card key={j.user_id} className="overflow-hidden rounded-lg border-l-4 border-l-primary/40 shadow-sm">
                <CardContent className="p-0">
                  <button type="button" className="grid w-full gap-3 p-4 text-left hover:bg-muted/40 md:grid-cols-[minmax(180px,1.5fr)_minmax(300px,2fr)_auto] md:items-center" onClick={() => setExpandedUser(isExpanded ? null : j.user_id)} aria-expanded={isExpanded}>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{j.email}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{j.phone || "No phone"}</span><span>·</span><span>{j.provider === "google" ? "Google" : "Email"}</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {steps(j).map((st, index) => (
                        <div key={st.label} className="flex min-w-0 flex-1 items-center last:flex-none">
                          <span title={st.label} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${st.ok && st.label === "First scan" ? "border-destructive bg-destructive text-destructive-foreground" : st.ok ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                            {st.ok ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          {index < steps(j).length - 1 && <span className={`h-px min-w-3 flex-1 ${st.ok ? "bg-primary/60" : "bg-border"}`} />}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <div className="text-right"><Badge variant={s === "done" ? "secondary" : "outline"}>{s === "under_three" ? `${j.best_day_scans} of 3 scans` : STAGE_LABEL[s]}</Badge><p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(latestActivity(j)))} ago</p></div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && <div className="border-t bg-background p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div className="space-y-3 text-sm">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium">{format(new Date(j.joined_at), "d MMM yyyy, h:mm a")}</p></div>
                          <div><p className="text-xs text-muted-foreground">Learning</p><p className="font-medium">{(j.completed_modules || []).length} of {learningModules.length} lessons</p></div>
                          <div><p className="text-xs text-muted-foreground">Suggested next step</p><p className="font-medium text-primary">{nextAction(j)}</p></div>
                        </div>
                        {lesson && <p className="text-muted-foreground">Next lesson: <span className="text-foreground">{lesson.title}</span></p>}
                        {j.admin_note && <p className="border-l-2 border-primary pl-3 italic text-muted-foreground">{j.admin_note}</p>}
                        {(j.open_questions || []).length > 0 && <div className="rounded-md bg-accent/50 px-3 py-2"><span className="font-medium">Question on {moduleTitle(j.open_questions?.[0]?.module)}:</span> “{j.open_questions?.[0]?.message}”</div>}
                        <p className="text-xs text-muted-foreground">{j.last_nudge_at ? `Last nudged ${formatDistanceToNow(new Date(j.last_nudge_at))} ago · ${j.nudge_count} total` : "No nudge sent yet"}</p>
                      </div>
                      <div className="flex flex-wrap content-start justify-end gap-2">
                        {(j.open_questions || []).length > 0 && <Button size="sm" variant="secondary" onClick={() => openNudge(j, "lesson_reply")}>Reply</Button>}
                        {lesson && <Button size="sm" variant="outline" onClick={() => openNudge(j, "learning")}>Next lesson</Button>}
                        <Button size="sm" variant="ghost" onClick={() => setEditUser({ j, phone: j.phone || "", note: j.admin_note || "" })}><Pencil className="h-4 w-4" />Edit</Button>
                        <Button size="sm" onClick={() => openNudge(j)} disabled={s === "done" && templates.length === 0}><MessageCircle className="h-4 w-4" />Nudge</Button>
                      </div>
                    </div>
                  </div>}
                </CardContent>
              </Card>
            );
          })}
          {visibleUsers.length === 0 && <p className="text-center text-muted-foreground py-8">Nothing here — and that's okay.</p>}
        </div>
      )}
        </main>

      <aside className="xl:sticky xl:top-6">
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <div><CardTitle className="text-lg">Nudge templates</CardTitle><p className="mt-1 text-xs text-muted-foreground">Ready-to-send messages</p></div>
          <Button size="sm" variant="outline" onClick={() => setEditing({ id: "", name: "", stage: "manual", channel: "both", message: "" })}>Add message</Button>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          <p className="px-1 text-xs text-muted-foreground">Use [Name] for their first name and [X] for today's scans.</p>
          {templates.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="text-xs">{STAGE_LABEL[t.stage] || t.stage}</Badge><span className="text-xs text-muted-foreground">{t.channel}</span></div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{t.message}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" aria-label={`Use ${t.name}`} title={`Use ${t.name}`} onClick={() => openManualNudge(t)}><MessageCircle className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${t.name}`} title={`Edit ${t.name}`} onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </aside>
      </div>

      <section id="setup-requests" className="scroll-mt-6">
        <SetupRequestsPanel />
      </section>

      <section className="grid gap-3 border-t pt-5 text-sm text-muted-foreground sm:grid-cols-3" aria-label="Journey legend">
        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><span>Latest activity helps you time a gentle follow-up.</span></div>
        <div className="flex items-center gap-2"><CircleAlert className="h-4 w-4 text-destructive" /><span>The red scan marker makes a first scan easy to spot.</span></div>
        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span>Progress stays private; receipt details remain owner-only.</span></div>
      </section>

      <Dialog open={!!manualNudge} onOpenChange={(open) => !open && setManualNudge(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Nudge a number</DialogTitle></DialogHeader>
          {manualNudge && <>
            <label className="text-sm" htmlFor="nudge-phone">WhatsApp number (include country code)</label>
            <Input id="nudge-phone" type="tel" placeholder="+1 868 123 4567" value={manualNudge.phone} onChange={(e) => setManualNudge({ ...manualNudge, phone: e.target.value })} maxLength={30} />
            {manualNudge.phone && !validManualPhone && <p className="text-sm text-muted-foreground">Please include the country code and full phone number.</p>}
            <label className="text-sm" htmlFor="nudge-name">Name (optional)</label>
            <Input id="nudge-name" value={manualNudge.name} onChange={(e) => setManualNudge({ ...manualNudge, name: e.target.value })} maxLength={100} />
            <Select value={manualNudge.templateId} onValueChange={(id) => {
              const template = templates.find((t) => t.id === id);
              if (template) setManualNudge({ ...manualNudge, templateId: id, message: template.message });
            }}>
              <SelectTrigger><SelectValue placeholder="Choose a message" /></SelectTrigger>
              <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <label className="text-sm" htmlFor="manual-nudge-message">Message</label>
            <Textarea id="manual-nudge-message" rows={8} value={manualNudge.message} onChange={(e) => setManualNudge({ ...manualNudge, message: e.target.value })} />
            <p className="text-xs text-muted-foreground">WhatsApp opens a draft for you to send. This does not create a sign-up or mark a message as sent.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" disabled={!manualMessage.trim()} onClick={async () => {
                try { await navigator.clipboard.writeText(manualMessage); toast.success("Copied — paste it anywhere"); }
                catch { toast("Couldn't copy. You can select and copy the message above."); }
              }}><Copy className="h-4 w-4 mr-1" />Copy</Button>
              <Button disabled={!validManualPhone || !manualMessage.trim()} onClick={() => window.open(generateWhatsAppUrl(manualDigits, manualMessage), "_blank", "noopener,noreferrer")}><MessageCircle className="h-4 w-4 mr-1" />Open WhatsApp</Button>
            </div>
          </>}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
