"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const roomCode = generateRoomCode();

  const { error } = await supabase
    .from("game_rooms")
    .insert({ room_code: roomCode, white_id: profile.id, status: "waiting" });

  if (error) {
    redirect(`/play?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/play/${roomCode}`);
}

export async function joinRoomByCode(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) redirect("/play?error=Enter a room code");

  redirect(`/play/${code}`);
}
