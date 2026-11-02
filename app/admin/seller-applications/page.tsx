import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/authz";
export const metadata={title:"Seller Applications | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function AdminSellerApplicationsPage(){
  await requireAdminPage("identity.review");
  redirect("/admin/identity-verification");
}