/** Guest check-in drafts stay on this device until the person signs in. */
const KEY = 'nuacha:checkin-draft';
const TTL = 24 * 60 * 60 * 1000;

export interface CheckinDraft { free: string; period: string; receipts: { name: string; dataUrl: string }[]; savedAt: number }

const toDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});

export const saveDraft = async (free: string, period: string, files: File[]) => {
  const receipts = await Promise.all(files.map(async (f) => ({ name: f.name, dataUrl: await toDataUrl(f) })));
  const draft: CheckinDraft = { free, period, receipts, savedAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(draft)); }
  catch { localStorage.setItem(KEY, JSON.stringify({ ...draft, receipts: [] })); }
};

export const loadDraft = (): CheckinDraft | null => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null') as CheckinDraft | null;
    if (!d || Date.now() - d.savedAt > TTL) { localStorage.removeItem(KEY); return null; }
    return d;
  } catch { return null; }
};

export const clearDraft = () => localStorage.removeItem(KEY);

export const draftFiles = async (d: CheckinDraft): Promise<File[]> =>
  Promise.all(d.receipts.map(async (r) => {
    const blob = await (await fetch(r.dataUrl)).blob();
    return new File([blob], r.name, { type: blob.type });
  }));
