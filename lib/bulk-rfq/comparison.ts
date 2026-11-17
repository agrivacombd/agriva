/** Pure RFQ quotation comparison helpers. No authorization decisions belong here. */
export type MoneyMinor = number;
export type QuoteComparison = {
  id: string;
  productSubtotalMinor: MoneyMinor;
  shippingMinor: MoneyMinor;
  feesMinor: MoneyMinor;
  deliveryDays: number | null;
  expiresAt: string;
  status: "approved" | "pending" | "rejected" | "withdrawn";
};
/** Display/sort only: authoritative order totals must be computed server-side in SQL. */
export function landedTotalMinor(q: QuoteComparison): MoneyMinor {
  for (const n of [q.productSubtotalMinor,q.shippingMinor,q.feesMinor]) {
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError("Invalid nonnegative money amount");
  }
  const total=q.productSubtotalMinor+q.shippingMinor+q.feesMinor;
  if (!Number.isSafeInteger(total)) throw new RangeError("Money total overflow");
  return total;
}
export function comparableQuotes(quotes: readonly QuoteComparison[], now: Date = new Date()): QuoteComparison[] {
  return quotes.filter(q=>q.status==="approved" && Number.isFinite(Date.parse(q.expiresAt)) && Date.parse(q.expiresAt)>now.getTime())
    .slice().sort((a,b)=>landedTotalMinor(a)-landedTotalMinor(b) || (a.deliveryDays??Infinity)-(b.deliveryDays??Infinity) || a.id.localeCompare(b.id));
}
