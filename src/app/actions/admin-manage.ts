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

async function requireSuperadmin() {
  const profile = await requireAdmin();
  if (profile.role !== "superadmin") redirect("/admin");
  return profile;
}

// ---------- Announcements ----------

export async function addAnnouncement(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) redirect("/admin/announcements?error=Title is required");

  await data.addAnnouncement(title, body);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  redirect("/admin/announcements");
}

export async function removeAnnouncement(id: string) {
  await requireAdmin();
  await data.removeAnnouncement(id);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}

// ---------- Admins ----------

export async function addAdmin(formData: FormData) {
  await requireSuperadmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "admin") as "superadmin" | "admin";
  if (!email) redirect("/admin/admins?error=Email is required");

  await data.addAdmin(email, role);
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}

export async function removeAdmin(email: string) {
  await requireSuperadmin();
  await data.removeAdmin(email);
  revalidatePath("/admin/admins");
}
