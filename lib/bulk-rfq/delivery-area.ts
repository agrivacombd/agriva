/** Display optional order-level delivery area without exposing placeholder data. */
export function formatBulkDeliveryArea(district?:string|null,upazila?:string|null):string {
 const parts=[district?.trim(),upazila?.trim()].filter(Boolean);
 return parts.length?parts.join(", "):"পরে জানানো হবে";
}
