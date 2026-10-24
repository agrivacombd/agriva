"use client";

import { useState } from "react";

type Category = { name: string; slug: string };
type Subcategory = { name: string; slug: string; categorySlug: string };
type Props = {
  categories: Category[];
  subcategories: Subcategory[];
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  legacyCategory?: string | null;
};

export default function TaxonomyFields({ categories, subcategories: allSubcategories, categorySlug = "", subcategorySlug = "", legacyCategory = "" }: Props) {
  const [category, setCategory] = useState(categorySlug ?? "");
  const [subcategory, setSubcategory] = useState(subcategorySlug ?? "");
  const subcategories = allSubcategories.filter(item => item.categorySlug === category);

  return (
    <>
      <label className="text-sm font-bold">ক্যাটাগরি
        <select name="category_slug" value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(""); }} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal">
          <option value="">নতুন taxonomy নির্বাচন নয়</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">সাব-ক্যাটাগরি
        <select name="subcategory_slug" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} disabled={!category} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal disabled:bg-slate-100">
          <option value="">সাব-ক্যাটাগরি নেই</option>
          {subcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      {!categorySlug && legacyCategory && <p className="md:col-span-2 xl:col-span-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">পুরোনো category label: <strong>{legacyCategory}</strong>। পরিচিত taxonomy-তে ম্যাপ না হলে সেটি সংরক্ষিত থাকবে; নতুন category বাছলে স্থায়ী taxonomy যুক্ত হবে।</p>}
    </>
  );
}
