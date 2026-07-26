"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }
  return profile;
}

async function uploadPhotoIfProvided(
  supabase: Awaited<ReturnType<typeof createClient>>,
  officerId: string,
  formData: FormData
) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return undefined;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${officerId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("officer-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return undefined;

  const {
    data: { publicUrl },
  } = supabase.storage.from("officer-photos").getPublicUrl(path);

  return publicUrl;
}

export async function addOfficer(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const role = String(formData.get("role") ?? "").trim();
  if (!role) redirect("/admin/officers?error=Role is required");

  const { data: existing } = await supabase
    .from("officers")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("officers")
    .insert({ role, sort_order: (existing?.sort_order ?? -1) + 1 })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/admin/officers?error=${encodeURIComponent(error?.message ?? "Could not add officer")}`
    );
  }

  revalidatePath("/admin/officers");
  revalidatePath("/about");
  redirect("/admin/officers");
}

export async function updateOfficer(officerId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const role = String(formData.get("role") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  const photoUrl = await uploadPhotoIfProvided(supabase, officerId, formData);

  const { error } = await supabase
    .from("officers")
    .update({
      role,
      name: name || null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", officerId);

  if (error) {
    redirect(`/admin/officers?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/officers");
  revalidatePath("/about");
  redirect("/admin/officers");
}

export async function removeOfficer(officerId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("officers").delete().eq("id", officerId);

  revalidatePath("/admin/officers");
  revalidatePath("/about");
}
