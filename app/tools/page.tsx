import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Farming Tools and Agriculture Calculators",
  description: "Explore practical farming tools for fertilizer rates, seed quantities, crop production costs, profit estimates and seasonal task planning.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free Farming Tools and Agriculture Calculators | AGRIVA",
    description: "Practical calculators for farm inputs, costs, crop planning and seasonal tasks.",
    url: "/tools",
    type: "website",
  },
  keywords: ["farming tools", "agriculture calculators", "fertilizer calculator", "seed rate calculator", "farm profit calculator"],
};

const tools = [
  { href: "/fertilizer-calculator", title: "Fertilizer Calculator", text: "Estimate total fertilizer quantities from your field area and an application rate supplied by you or a local recommendation." },
  { href: "/seed-rate-calculator", title: "Seed Rate Calculator", text: "Work out seed quantities for different field sizes and common area units." },
  { href: "/farming-cost-profit-calculator", title: "Farm Cost and Profit Calculator", text: "Estimate expenses, revenue and possible profit or loss using your own costs, yield and selling price." },
  { href: "/crop-calendar", title: "Crop Calendar and Checklist", text: "Organize seasonal farm activities and track the tasks you have completed." },
  { href: "/soil-fertilizer", title: "Soil and Fertilizer Planner", text: "Calculate nutrient quantities using soil-test results or locally recommended rates." },
  { href: "/crop-choice", title: "Crop Choice and Profit Comparison", text: "Compare estimated costs, yield and revenue across different crop options." },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-[#f6faf7] px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-900 to-teal-800 p-7 text-white sm:p-12">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-200">AGRIVA · Practical farm tools</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Free Farming Tools for Better Planning</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-emerald-50">Use simple calculators to plan farm inputs, understand production costs and compare crop scenarios. Enter your own field data to get estimates that are easier to review and adapt to your farm.</p>
          <Link href="/agriculture-calculators" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-50">Browse all agriculture calculators →</Link>
        </header>
        <section className="mt-10" aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="text-2xl font-black sm:text-3xl">Choose a tool for your next farm decision</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Each calculator focuses on a specific task. Results are estimates based on your inputs, not a substitute for local agronomic advice or verified market prices.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <h3 className="text-xl font-extrabold">{tool.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tool.text}</p>
                <span className="mt-4 inline-block font-bold text-emerald-800">Open tool →</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-10 rounded-2xl border border-emerald-100 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-black">Use estimates responsibly</h2>
          <p className="mt-3 leading-7 text-slate-600">Fertilizer and seed requirements vary by crop, variety, soil condition, climate and planting method. Use soil-test results and guidance from local agricultural experts. For profit estimates, include labour, irrigation, rent, transport, storage and potential losses; actual yields and prices can change.</p>
        </section>
      </div>
    </main>
  );
}
