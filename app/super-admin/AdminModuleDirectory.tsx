"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  category: "Operations" | "Marketplace" | "Content & discovery" | "Governance";
};

const categories: AdminModule["category"][] = [
  "Operations",
  "Marketplace",
  "Content & discovery",
  "Governance",
];

export default function AdminModuleDirectory({ modules }: { modules: AdminModule[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return modules;
    return modules.filter((module) =>
      [module.title, module.description, module.href, module.category]
        .some((value) => value.toLocaleLowerCase().includes(normalized)),
    );
  }, [modules, query]);

  return (
    <section aria-label="Admin modules" className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Workspace</h2>
          <p className="mt-1 text-sm text-[#657467]">
            {filtered.length} of {modules.length} tools · Search by name or task
          </p>
        </div>
        <label className="block w-full sm:max-w-sm">
          <span className="sr-only">Search admin modules</span>
          <span className="flex min-h-12 items-center gap-2 rounded-xl border border-[#d8e2d4] bg-white px-3 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#657467]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search admin tools…"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-[#17351f] outline-none placeholder:text-[#839087]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
                Clear
              </button>
            )}
          </span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#cbd8c6] bg-white p-8 text-center">
          <p className="font-bold">No matching admin tools</p>
          <p className="mt-1 text-sm text-[#657467]">Try another keyword, or clear the search.</p>
          <button type="button" onClick={() => setQuery("")} className="mt-4 min-h-11 rounded-xl bg-[#17351f] px-4 py-2 text-sm font-bold text-white">
            Clear search
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          {categories.map((category) => {
            const items = filtered.filter((module) => module.category === category);
            if (items.length === 0) return null;
            return (
              <section key={category} aria-label={category}>
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-[#718073]">{category}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((module) => (
                    <Link
                      key={module.href}
                      href={module.href}
                      className="group flex min-h-36 min-w-0 flex-col rounded-2xl border border-[#e0e8dd] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-800/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:p-5"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4e9] text-2xl">{module.icon}</span>
                        <span aria-hidden="true" className="text-lg text-[#839087] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                      </span>
                      <span className="mt-4 break-words text-base font-extrabold">{module.title}</span>
                      <span className="mt-1 break-words text-sm leading-5 text-[#657467]">{module.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
