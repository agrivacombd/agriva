/** RFQ quantity unit validation. Keep aligned with the Postgres CHECK constraint. */
export const STANDARD_BULK_UNITS = [
  {value:"kg",label:"কেজি"},
  {value:"ton",label:"টন"},
  {value:"maund",label:"মণ"},
  {value:"bag",label:"বস্তা"},
  {value:"packet",label:"প্যাকেট"},
  {value:"gram",label:"গ্রাম"},
  {value:"litre",label:"লিটার"},
  {value:"piece",label:"পিস"},
  {value:"dozen",label:"ডজন"},
  {value:"tray",label:"ট্রে"},
] as const;
export const CUSTOM_UNIT_VALUE = "__custom__";
export const isStandardBulkUnit = (value:string):boolean =>
 STANDARD_BULK_UNITS.some(option=>option.value===value);
export const normalizeBulkUnit = (value:string):string => value.trim();
export function isValidBulkUnit(value:string):boolean {
 const unit=normalizeBulkUnit(value);
 return unit.length>=1&&unit.length<=30&&unit!==CUSTOM_UNIT_VALUE&&!/[\x00-\x1f\x7f<>]/.test(unit);
}
