import {redirect} from "next/navigation";
import {requireAdminPage} from "@/lib/admin/authz";

export const metadata={title:"Article Review | AGRIVA Admin",robots:{index:false,follow:false}};
export default async function LegacyArticleReview({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {supabase}=await requireAdminPage("content.read");
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)){
    const {data}=await supabase.from("content_drafts").select("id").eq("id",id).eq("content_type","article").maybeSingle();
    if(data)redirect("/admin/content-drafts?draft="+encodeURIComponent(data.id));
  }
  redirect("/admin/articles");
}
