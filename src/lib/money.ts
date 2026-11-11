/** All money in the app is integer agorot (1 ₪ = 100 agorot). */
const formatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatILS(agorot: number): string {
  return formatter.format(agorot / 100);
}

export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}
