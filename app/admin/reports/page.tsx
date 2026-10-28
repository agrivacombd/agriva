import Link from "next/link";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

export default async function AdminReportsPage() {
  const auth = await authorizePermission("analytics.read_aggregated");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }
  const supabase = auth.supabase;

  const [orders, products, commissions, payouts] = await Promise.all([
    supabase.from("marketplace_orders").select("id,created_at,status,payment_status,payment_method,total_amount,quantity").order("created_at",{ascending:false}).limit(5000),
    supabase.from("products").select("id,status,price,stock").limit(5000),
    supabase.from("reseller_commissions").select("id,status,amount").limit(5000),
    supabase.from("commission_payouts").select("id,status,amount").limit(5000),
  ]);
  const orderRows = orders.data ?? [];
  const productRows = products.data ?? [];
  const commissionRows = commissions.data ?? [];
  const payoutRows = payouts.data ?? [];
  const totalOrderValue = orderRows.filter(x=>!["cancelled","refunded"].includes(x.status)).reduce((n,x)=>n+Number(x.total_amount??0),0);
  const collectedCod = orderRows.filter(x=>x.payment_status==="paid").reduce((n,x)=>n+Number(x.total_amount??0),0);
  const count = (rows:{status:string|null}[], status:string) => rows.filter(x=>x.status===status).length;
  const money = (v:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT",maximumFractionDigits:2}).format(v);
  const errors = [orders.error,products.error,commissions.error,payouts.error].filter(Boolean);
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Reports & exports</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Business intelligence</p><h1 className="mt-2 text-3xl font-black">রিপোর্ট ও ডেটা এক্সপোর্ট</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">সর্বশেষ ৫,০০০ পর্যন্ত রেকর্ডের সারাংশ। অর্ডার CSV-তে ব্যক্তিগত shipping address বা buyer contact export করা হয় না।</p>
    {errors.length>0&&<p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">কিছু রিপোর্ট টেবিল পড়া যায়নি। Supabase schema ও admin read policies যাচাই করুন।</p>}
    {errors.length === 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Non-cancelled order value",money(totalOrderValue),"এটি net revenue বা collected cash নয়"],
      ["Paid order value",money(collectedCod),"payment_status = paid হিসেবে চিহ্নিত"],
      ["Products",String(productRows.length),`${count(productRows,"active")} active · ${count(productRows,"draft")} draft`],
      ["Orders",String(orderRows.length),`${count(orderRows,"processing")} processing · ${count(orderRows,"delivered")} delivered`],
      ["Pending commissions",String(count(commissionRows,"pending")),"review required"],
      ["Approved commissions",String(count(commissionRows,"approved")),"not necessarily paid out"],
      ["Requested payouts",String(count(payoutRows,"requested")),"waiting for admin"],
      ["Paid payouts",String(count(payoutRows,"paid")),"recorded as paid"],
    ].map(([label,value,sub])=><div key={label} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#657467]">{label}</p><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-2 text-xs text-[#7b887d]">{sub}</p></div>)}</div> : <p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">ডেটা অসম্পূর্ণ থাকায় ভুল সারাংশ এড়াতে রিপোর্টের মেট্রিক দেখানো হচ্ছে না। সব টেবিলের query সফল হলে আবার চেষ্টা করুন।</p>}
    <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-6"><h2 className="text-lg font-black">ডাউনলোড</h2><p className="mt-1 text-sm text-[#748074]">CSV ফাইল Excel/Google Sheets-এ খোলা যাবে। রেকর্ডের সংখ্যা সীমিত রাখা হয়েছে যাতে বড় export সার্ভারকে চাপ না দেয়।</p><div className="mt-5 flex flex-wrap gap-3"><a href="/admin/reports/orders.csv" className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">Download orders CSV ↓</a><Link href="/admin/audit" className="rounded-xl border border-[#cbdcc7] px-5 py-3 text-sm font-extrabold">Admin audit log ↗</Link></div></section>
    <p className="mt-4 text-xs leading-5 text-[#7b887d]">রিপোর্টগুলো operational summary; হিসাবরক্ষণ/কর নির্ধারণের চূড়ান্ত financial statement নয়।</p>
  </div></main>;
}
