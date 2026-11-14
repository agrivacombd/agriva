export type ShippingItem = { shipping_class: string | null; shipping_weight_grams: number | null; quantity: number };
export function calculateShippingFee(items: ShippingItem[]): { fee: number; paddyWeightGrams: number } | null {
  let grams = 0;
  let hasPacket = false;
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) return null;
    if (item.shipping_class === "paddy") {
      const weight = item.shipping_weight_grams;
      if (!Number.isSafeInteger(weight) || !weight || weight < 1) return null;
      grams += weight * item.quantity;
      if (!Number.isSafeInteger(grams)) return null;
    } else if (item.shipping_class === "packet") hasPacket = true;
    else return null;
  }
  if (grams > 0) return { fee: 135 + Math.max(0, Math.ceil(grams / 1000) - 1) * 20, paddyWeightGrams: grams };
  return { fee: hasPacket ? 70 : 0, paddyWeightGrams: 0 };
}
