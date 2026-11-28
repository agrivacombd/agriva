"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";

export async function reviewModuleApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "").trim();
  const decision = String(formData.get("decision") || "").trim();
  const reviewNote = String(formData.get("reviewNote") || "").trim().slice(0, 1000);

  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
    throw new Error("Invalid application reference.");
  }
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Invalid review decision.");
  }
  if (decision === "rejected" && reviewNote.length < 5) {
    throw new Error("Please provide a rejection reason (at least 5 characters).");
  }

  const { supabase } = await requireAdminPage("identity.review");
  const { error } = await supabase.rpc("admin_review_module_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_review_note: reviewNote || null,
  });

  if (error) {
    if (error.code === "P0002") {
      throw new Error("This application has already been reviewed or is no longer pending.");
    }
    throw new Error("Application review failed. No decision was recorded.");
  }

  revalidatePath("/admin/identity-verification");
  revalidatePath("/admin/seller-applications");
  revalidatePath("/admin/plant-market-applications");
  revalidatePath("/admin/audit");
}
