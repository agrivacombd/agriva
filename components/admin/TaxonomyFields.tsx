"use client";

import { useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

type Props = {
  categorySlug?: string | null;
  subcategorySlug?: string | null;
};

export default function TaxonomyFields({ categorySlug = "", subcategorySlug = "" }: Props) {
  const [category, setCategory] = useState(categorySlug ?? "");
  const [subcategory, setSubcategory] = useState(subcategorySlug ?? "");
  const selectedCategory = MARKETPLACE_CATEGORIES.find((item) => item.slug === category);
  const subcategories = selectedCategory?.subcategories ?? [];

  return (
    <>
      <label className="text-sm font-bold">ক্যাটাগরি
        <select name="category_slug" value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(""); }} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">
          <option value="">ক্যাটাগরি নেই</option>
          {MARKETPLACE_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি
        <select name="subcategory_slug" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} disabled={!selectedCategory} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal disabled:bg-slate-100">
          <option value="">সাব-ক্যাটাগরি নেই</option>
          {subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
    </>
  );
}
