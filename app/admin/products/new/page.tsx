import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/authz";
import AdminCreateProductForm from "@/components/admin/AdminCreateProductForm";

export default async function NewAdminProductPage() {
  await requireAdminPage("catalog.create");
  return <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-5xl px-4 py-6 text-[#17351f] sm:px-6">
    <div className="mb-5"><Link href="/admin/products" className="text-sm font-bold text-[#54705b] hover:underline">← Back to Products</Link><h1 className="mt-3 text-2xl font-black sm:text-3xl">Add New Product</h1><p className="mt-2 text-sm text-[#637266]">পণ্যের তথ্য পূরণ করে Draft হিসেবে তৈরি করুন। পরে Edit page থেকে review ও publish করতে পারবেন।</p></div>
    <AdminCreateProductForm />
  </main>;
}
