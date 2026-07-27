"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import * as data from "@/lib/sheets/data";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function addOfficer(formData: FormData) {
  await requireAdmin();

  const role = String(formData.get("role") ?? "").trim();
  if (!role) redirect("/admin/officers?error=Role is required");

  await data.addOfficer(role);

  revalidatePath("/admin/officers");
  revalidatePath("/about");
  redirect("/admin/officers");
}

export async function updateOfficer(officerId: string, formData: FormData) {
  await requireAdmin();

  const role = String(formData.get("role") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  await data.updateOfficer(officerId, {
    role,
    name,
    ...(photoUrl ? { photoUrl } : {}),
  });

  revalidatePath("/admin/officers");
  revalidatePath("/about");
  redirect("/admin/officers");
}

export async function removeOfficer(officerId: string) {
  await requireAdmin();
  await data.removeOfficer(officerId);
  revalidatePath("/admin/officers");
  revalidatePath("/about");
}
