import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input/input";
import "react-phone-number-input/style.css";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/contexts/AuthProvider";
import { supabase } from "@/lib/supabase";
import { identifyUser, trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

/** Asks signed-in people without a WhatsApp number (e.g. Google sign-ups) for one, once per day. */
export const PENDING_KEY = "wa_prompt_pending";

export default function WhatsAppNumberPrompt() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [fromLink, setFromLink] = useState(false);
  const [onFile, setOnFile] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Direct link: nuacha.com/?add=whatsapp opens this prompt (after sign-in if needed).
  useEffect(() => {
    if (isLoading) return; // wait until we know whether they're signed in
    const wants = new URLSearchParams(location.search).get("add") === "whatsapp";
    if (wants) trackEvent("whatsapp_link_open");
    const pendingAt = Number(localStorage.getItem(PENDING_KEY) || 0);
    const pending = pendingAt && Date.now() - pendingAt < 30 * 60 * 1000;
    if (!user) {
      if (wants) {
        localStorage.setItem(PENDING_KEY, String(Date.now()));
        if (location.pathname !== "/login") {
          toast("Sign in to add your WhatsApp number 🌿");
          navigate("/login");
        }
      }
      return;
    }
    if (wants || pending) {
      localStorage.removeItem(PENDING_KEY);
      setFromLink(true);
      (async () => {
        const { data } = await supabase.auth.getUser();
        const { data: prof } = await supabase.from("profiles").select("phone_number").eq("id", user.id).maybeSingle();
        const existing = (data.user?.user_metadata as any)?.phone_number || data.user?.phone || prof?.phone_number || "";
        if (existing) { const n = existing.startsWith("+") ? existing : `+${existing}`; setPhone(n); setOnFile(n); }
        setOpen(true);
      })();
    }
  }, [location.search, location.pathname, user, isLoading]);

  useEffect(() => {
    identifyUser(user?.id ?? null);
    if (!user) return;
    const provider = (user.app_metadata as any)?.provider ?? "email";
    const ageMs = Date.now() - new Date(user.created_at).getTime();
    const seenKey = `signup_tracked_${user.id}`;
    if (ageMs < 10 * 60 * 1000 && !localStorage.getItem(seenKey)) {
      trackEvent("sign_up", { method: provider });
      localStorage.setItem(seenKey, "1");
    }
    const has = (user.user_metadata as any)?.phone_number || user.phone;
    const key = `wa_prompt_${user.id}`;
    const last = Number(localStorage.getItem(key) || 0);
    if (fromLink) return;
    if (!has && Date.now() - last > 24 * 60 * 60 * 1000) {
      const t = setTimeout(() => { setOpen(true); trackEvent("whatsapp_prompt_shown", { method: provider }); }, 2500);
      return () => clearTimeout(t);
    }
  }, [user, fromLink]);

  if (!user) return null;

  const clearLink = () => {
    setFromLink(false);
    if (new URLSearchParams(location.search).get("add") === "whatsapp") navigate(location.pathname, { replace: true });
  };

  const later = () => {
    localStorage.setItem(`wa_prompt_${user.id}`, String(Date.now()));
    setOpen(false);
    clearLink();
  };

  const save = async () => {
    if (!phone) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { phone_number: phone } });
    setSaving(false);
    if (error) { toast("That didn't save — let's try again in a moment."); return; }
    await supabase.from("profiles").upsert({ id: user.id, phone_number: phone });
    setOnFile(phone);
    trackEvent("whatsapp_number_added");
    toast.success("Thank you — that's saved.");
    setOpen(false);
    clearLink();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : later())}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-playfair">One small thing</DialogTitle>
          <DialogDescription>
            {onFile
              ? <>We have <strong>{onFile}</strong> on file. Want to change it?</>
              : <>Add your WhatsApp number so we can gently help if you get stuck. We'll never spam you.</>}
          </DialogDescription>
        </DialogHeader>
        <PhoneInput
          value={phone}
          onChange={(v) => setPhone(v || "")}
          defaultCountry="TT"
          placeholder="+1 868 123 4567"
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={later}>{onFile ? "Keep it" : "Maybe later"}</Button>
          <Button onClick={save} disabled={!phone || saving || phone === onFile}>{onFile ? "Save change" : "Save number"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
