import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";
import ProductForm from "@/components/farmer/ProductForm";

export default async function NewProductPage() {
  const auth = await authorizePermission("catalog.create_own");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/farmer/products/new");
    redirect("/dashboard");
  }
  if (!auth.roles.some((role) => role === "farmer" || role === "seller")) redirect("/dashboard");
  return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">Seller marketplace</p><h1 className="mt-2 text-4xl font-black">Add a product</h1><p className="mt-3 text-[#647468]">Your listing will stay pending until an admin reviews it.</p><ProductForm /></div></main>;
}
