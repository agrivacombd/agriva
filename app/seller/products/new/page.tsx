import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerProductForm from "@/components/seller/SellerProductForm";
import { findMarketplaceOrganizationWithAccess } from "@/lib/authz/module-access";

export default async function NewSellerProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/seller/products/new");

  const access = await findMarketplaceOrganizationWithAccess("create");
  if (!access.allowed) redirect("/account/verification");

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]">
      <div className="mx-auto max-w-3xl">
        <Link href="/marketplace" className="text-sm font-bold text-emerald-800 hover:underline">← মার্কেটপ্লেসে ফিরে যান</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Marketplace · Seller Centre</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">ব্যবসার পণ্য যোগ করুন</h1>
        <p className="mt-3 leading-7 text-[#647468]">কোম্পানি ও বিক্রেতারা এখানে কৃষি উপকরণ, প্যাকেটজাত পণ্য এবং অন্যান্য অনুমোদিত পণ্য জমা দিতে পারবেন। অ্যাডমিন যাচাই ও অনুমোদনের আগে পণ্য প্রকাশ হবে না।</p>
        <SellerProductForm />
      </div>
    </main>
  );
}
