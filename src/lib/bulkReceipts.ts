/** Hands receipt photos picked elsewhere (e.g. the home page) to Talk it through, in memory only. */
let pending: File[] = [];
export const setPendingReceipts = (files: File[]) => { pending = files; };
export const takePendingReceipts = (): File[] => { const f = pending; pending = []; return f; };
