import Link from "next/link";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

type Product = {
  id: string;
  name: string;
  price: number | string;
  stock: number | string;
  status: "draft" | "active" | "paused" | "sold_out";
  category: string;
  updated_at: string;
};

const statusLabel: Record<Product["status"], string> = {
  draft: "পর্যালোচনার অপেক্ষায়",
  active: "প্রকাশিত",
  paused: "সাময়িক বন্ধ",
  sold_out: "স্টক শেষ",
};

export default async function SellerDashboardPage() {
  const auth = await authorizePermission("catalog.read_public");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/seller");
    redirect("/dashboard");
  }
  if (!auth.roles.some((role) => role === "seller" || role === "farmer" || role === "admin")) {
    redirect("/dashboard");
  }

  const { data, error } = await auth.supabase
    .from("products")
    .select("id,name,price,stock,status,category,updated_at")
    .eq("farmer_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  const products = (data ?? []) as Product[];
  const pending = products.filter((product) => product.status === "draft").length;
  const live = products.filter((product) => product.status === "active").length;

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123b27] p-6 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">AGRIVA • Seller Workspace</p>
            <h1 className="mt-2 text-3xl font-black">Seller Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">নিজের পণ্য, স্টক ও moderation status এক জায়গায় পরিচালনা করুন।</p>
          </div>
          <Link href="/farmer/products/new" className="rounded-xl bg-[#d3b252] px-5 py-3 text-sm font-extrabold text-[#17351f]">+ নতুন পণ্য জমা দিন</Link>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#e1e9df] bg-white p-5"><p className="text-sm text-[#647568]">আমার মোট পণ্য</p><p className="mt-2 text-3xl font-black">{products.length}</p></article>
          <article className="rounded-2xl border border-[#e1e9df] bg-white p-5"><p className="text-sm text-[#647568]">পর্যালোচনার অপেক্ষায়</p><p className="mt-2 text-3xl font-black">{pending}</p></article>
          <article className="rounded-2xl border border-[#e1e9df] bg-white p-5"><p className="text-sm text-[#647568]">প্রকাশিত পণ্য</p><p className="mt-2 text-3xl font-black">{live}</p></article>
        </section>

        <section className="mt-7 rounded-3xl border border-[#e1e9df] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-black">আমার পণ্য</h2><p className="mt-1 text-sm text-[#647568]">এই তালিকায় শুধু আপনার account-এর পণ্য দেখানো হয়।</p></div>
            <Link href="/marketplace" className="text-sm font-bold text-[#126b4f] underline">মার্কেটপ্লেস দেখুন</Link>
          </div>
          {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">পণ্যের তালিকা লোড করা যায়নি। অনুমতি ও database policy যাচাই করে আবার চেষ্টা করুন।</p> :
            products.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed p-8 text-center"><p className="font-bold">এখনো কোনো পণ্য জমা দেননি।</p><p className="mt-2 text-sm text-[#647568]">প্রথম পণ্যটি জমা দিন। অনুমোদনের আগে এটি public marketplace-এ দেখাবে না।</p><Link href="/farmer/products/new" className="mt-4 inline-flex rounded-xl bg-[#17452c] px-5 py-3 text-sm font-bold text-white">পণ্য যোগ করুন</Link></div> :
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-[#647568]"><th className="px-3 py-3">পণ্য</th><th className="px-3 py-3">ক্যাটাগরি</th><th className="px-3 py-3">মূল্য</th><th className="px-3 py-3">স্টক</th><th className="px-3 py-3">অবস্থা</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b last:border-0"><td className="px-3 py-4 font-bold">{product.name}</td><td className="px-3 py-4">{product.category}</td><td className="px-3 py-4">৳{Number(product.price).toLocaleString("en-BD")}</td><td className="px-3 py-4">{Number(product.stock).toLocaleString("en-BD")}</td><td className="px-3 py-4"><span className={product.status === "active" ? "rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800" : "rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800"}>{statusLabel[product.status] ?? product.status}</span></td></tr>)}</tbody></table></div>}
        </section>
        <p className="mt-5 text-xs leading-5 text-[#647568]">নিরাপত্তা: seller dashboard-এর তালিকা authenticated account ID দিয়ে সীমাবদ্ধ। পণ্য প্রকাশ, moderation এবং commission policy seller-এর নিজস্ব নিয়ন্ত্রণে নয়।</p>
      </div>
    </main>
  );
}
