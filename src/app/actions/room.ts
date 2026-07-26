"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

/** Claims the open white/black slot in a room for the current user, if one is open. */
export async function claimRoomSlot(roomCode: string) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("game_rooms")
    .select("id, white_id, black_id, status")
    .eq("room_code", roomCode)
    .single();

  if (!room) return;
  if (room.white_id === profile.id || room.black_id === profile.id) return;

  if (!room.white_id) {
    await supabase.from("game_rooms").update({ white_id: profile.id }).eq("id", room.id);
  } else if (!room.black_id) {
    await supabase
      .from("game_rooms")
      .update({ black_id: profile.id, status: "active" })
      .eq("id", room.id);
  }

  revalidatePath(`/play/${roomCode}`);
}
