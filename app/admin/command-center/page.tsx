import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CommandCenterClient from "./CommandCenterClient";

export const metadata = { title: "Super Admin Command Center | AGRIVA", robots: { index: false, follow: false } };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin%2Fcommand-center");
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

export default async function SuperAdminCommandCenterPage() {
  const supabase = await requireAdmin();
  const sources = [
    { key: "profiles", label: "Users & roles", query: () => supabase.from("profiles").select("id", { count: "exact", head: true }), href: "/admin/users", hint: "accounts" },
    { key: "products", label: "Marketplace products", query: () => supabase.from("products").select("id", { count: "exact", head: true }), href: "/admin/products", hint: "all statuses" },
    { key: "orders", label: "Orders", query: () => supabase.from("marketplace_orders").select("id", { count: "exact", head: true }), href: "/admin/orders", hint: "all orders" },
    { key: "article_drafts", label: "Article drafts", query: () => supabase.from("article_drafts").select("id", { count: "exact", head: true }), href: "/admin/articles", hint: "editorial queue" },
    { key: "content_drafts", label: "SEO content drafts", query: () => supabase.from("content_drafts").select("id", { count: "exact", head: true }), href: "/admin/content-drafts", hint: "content library" },
    { key: "admin_audit_log", label: "Admin audit events", query: () => supabase.from("admin_audit_log").select("id", { count: "exact", head: true }), href: "/admin/audit", hint: "audit records" },
    { key: "site_settings", label: "Site settings", query: () => supabase.from("site_settings").select("key", { count: "exact", head: true }), href: "/admin/settings", hint: "configuration keys" },
    { key: "job_posts", label: "Agriculture jobs", query: () => supabase.from("job_posts").select("id", { count: "exact", head: true }), href: "/admin/jobs", hint: "job listings" },
    { key: "harvest_listings", label: "Harvest listings", query: () => supabase.from("harvest_listings").select("id", { count: "exact", head: true }), href: "/admin/harvest", hint: "farmer listings" },
  ];
  const results = await Promise.all(sources.map(async source => {
    try {
      const result = await source.query();
      return { ...source, count: result.count ?? null, available: !result.error, note: result.error ? (result.error.code === "42P01" || result.error.code === "PGRST205" ? "Table নেই বা API schema cache-এ নেই" : "Query/permission error; details server-side") : "Read query successful" };
    } catch {
      return { ...source, count: null, available: false, note: "Read query ব্যর্থ; server configuration যাচাই করুন" };
    }
  }));
  const metricKeys = ["profiles", "products", "orders", "article_drafts", "content_drafts", "admin_audit_log"];
  const metrics = results.filter(r => metricKeys.includes(r.key)).map(r => ({ label: r.label, value: r.count, hint: r.hint, href: r.href }));
  const health = results.map(r => ({ label: r.label, available: r.available, note: r.note }));
  return <CommandCenterClient metrics={metrics} health={health} />;
}
