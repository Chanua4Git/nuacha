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
export default function WhatsAppNumberPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Direct link: nuacha.com/?add=whatsapp opens this prompt (after sign-in if needed).
  useEffect(() => {
    const wants = new URLSearchParams(location.search).get("add") === "whatsapp";
    if (wants) {
      sessionStorage.setItem("wa_prompt_pending", "1");
      trackEvent("whatsapp_link_open");
      if (!user) {
        toast("Sign in first, then we'll ask for your WhatsApp number 🌿");
        navigate("/login");
      }
    }
    if (user && sessionStorage.getItem("wa_prompt_pending")) {
      sessionStorage.removeItem("wa_prompt_pending");
      setOpen(true);
    }
  }, [location.search, user]);

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
    if (!has && Date.now() - last > 24 * 60 * 60 * 1000) {
      const t = setTimeout(() => { setOpen(true); trackEvent("whatsapp_prompt_shown", { method: provider }); }, 2500);
      return () => clearTimeout(t);
    }
  }, [user]);

  if (!user) return null;

  const later = () => {
    localStorage.setItem(`wa_prompt_${user.id}`, String(Date.now()));
    setOpen(false);
  };

  const save = async () => {
    if (!phone) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { phone_number: phone } });
    setSaving(false);
    if (error) { toast("That didn't save — let's try again in a moment."); return; }
    trackEvent("whatsapp_number_added");
    toast.success("Thank you — that's saved.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : later())}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-playfair">One small thing</DialogTitle>
          <DialogDescription>
            Add your WhatsApp number so we can gently help if you get stuck. We'll never spam you.
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
          <Button variant="ghost" onClick={later}>Maybe later</Button>
          <Button onClick={save} disabled={!phone || saving}>Save number</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
