import { redirect } from "next/navigation";

/** Legacy URL retained as a single canonical entry point. */
export default function LegacyOpportunitiesPage() {
  redirect("/admin/search-intelligence");
}
