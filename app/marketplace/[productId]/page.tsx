import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase.from("products").select("id,name,price,stock,commission_percent,farmer_id").eq("id", productId).eq("status", "active").maybeSingle();
  if (!product) notFound();
  return <main className="min-h-screen bg-[#f6f8f3] px-6 py-14 text-[#17351f]"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-bold text-[#b58b28]">AGRIVA MARKETPLACE</p><h1 className="mt-3 text-4xl font-black">{product.name}</h1><p className="mt-4 text-3xl font-black">৳{Number(product.price).toLocaleString()}</p><p className="mt-2 text-sm text-[#647468]">Stock available: {product.stock}</p><div className="mt-8 rounded-2xl bg-[#eef5ed] p-5"><p className="font-bold">Reseller commission</p><p className="mt-1 text-sm text-[#647468]">This product offers {product.commission_percent}% commission through eligible reseller links.</p></div><CheckoutButton productId={product.id} disabled={product.stock < 1}/></div></main>;
}
