/** A statement line matches a saved expense when amounts are equal (to the cent) and dates are within `days` (banks post late). */
export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.abs(Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000;
}

export function findExistingMatch<T extends { amount: number; date: string }>(
  line: { amount: number; date: string },
  saved: T[],
  days = 3,
): T | undefined {
  return saved.find(
    (e) => Math.round(Number(e.amount) * 100) === Math.round(line.amount * 100) && daysBetween(e.date, line.date) <= days,
  );
}
