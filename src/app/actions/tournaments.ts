"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { generateSwissPairings } from "@/lib/pairing/swiss";
import { generateRoundRobinRound } from "@/lib/pairing/roundRobin";
import { computeStandings } from "@/lib/pairing/standings";
import { updateElo } from "@/lib/elo";
import type { PairingResult } from "@/lib/supabase/types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }
  return profile;
}

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "");
  const format = String(formData.get("format") ?? "swiss") as
    | "swiss"
    | "round_robin";

  const { data, error } = await supabase
    .from("events")
    .insert({ name, event_date: eventDate, format, created_by: admin.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/admin?error=${encodeURIComponent(error?.message ?? "Could not create event")}`);
  }

  revalidatePath("/admin");
  redirect(`/admin/events/${data.id}`);
}

export async function registerPlayer(eventId: string, profileId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, profile_id: profileId });

  revalidatePath(`/admin/events/${eventId}`);
}

export async function unregisterPlayer(eventId: string, profileId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);

  revalidatePath(`/admin/events/${eventId}`);
}

export async function generateNextRound(eventId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (!event) redirect("/admin");

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("profile_id, profiles(id, rating)")
    .eq("event_id", eventId);

  const players = (
    (registrations ?? []) as unknown as {
      profiles: { id: string; rating: number };
    }[]
  ).map((r) => ({ id: r.profiles.id, rating: r.profiles.rating, score: 0 }));

  if (players.length < 2) {
    redirect(`/admin/events/${eventId}?error=${encodeURIComponent("Need at least 2 registered players")}`);
  }

  const { data: existingRoundsRaw } = await supabase
    .from("rounds")
    .select("id, round_number, pairings(white_id, black_id, result)")
    .eq("event_id", eventId)
    .order("round_number", { ascending: true });

  const existingRounds = existingRoundsRaw as unknown as {
    id: string;
    round_number: number;
    pairings: {
      white_id: string | null;
      black_id: string | null;
      result: PairingResult;
    }[];
  }[];

  const nextRoundNumber = (existingRounds?.length ?? 0) + 1;

  const allPairings = (existingRounds ?? []).flatMap((r) => r.pairings ?? []);
  const allPairingsCamel = allPairings.map((p) => ({
    whiteId: p.white_id,
    blackId: p.black_id,
    result: p.result,
  }));

  let newPairings: { whiteId: string; blackId: string | null }[];

  if (event.format === "round_robin") {
    newPairings = generateRoundRobinRound(players, nextRoundNumber);
  } else {
    const standings = computeStandings(
      players.map((p) => p.id),
      allPairingsCamel
    );
    const scoreById = new Map(standings.map((s) => [s.profileId, s.score]));
    const scoredPlayers = players.map((p) => ({
      ...p,
      score: scoreById.get(p.id) ?? 0,
    }));
    newPairings = generateSwissPairings(
      scoredPlayers,
      allPairingsCamel
        .filter((p) => p.whiteId)
        .map((p) => ({ whiteId: p.whiteId as string, blackId: p.blackId }))
    );
  }

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({ event_id: eventId, round_number: nextRoundNumber })
    .select("id")
    .single();

  if (roundError || !round) {
    redirect(`/admin/events/${eventId}?error=${encodeURIComponent(roundError?.message ?? "Could not create round")}`);
  }

  await supabase.from("pairings").insert(
    newPairings.map((p) => ({
      round_id: round.id,
      white_id: p.whiteId,
      black_id: p.blackId,
    }))
  );

  if (event.status === "draft") {
    await supabase.from("events").update({ status: "active" }).eq("id", eventId);
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
}

export async function submitResult(
  pairingId: string,
  eventId: string,
  result: PairingResult
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: pairing } = await supabase
    .from("pairings")
    .select("white_id, black_id, result")
    .eq("id", pairingId)
    .single();

  if (!pairing) redirect(`/admin/events/${eventId}`);

  await supabase.from("pairings").update({ result }).eq("id", pairingId);

  // Update the club ladder immediately when a decisive/drawn game (not a bye) is recorded.
  if (
    pairing.white_id &&
    pairing.black_id &&
    result !== "pending" &&
    pairing.result === "pending" // only apply once, first time this game is scored
  ) {
    const { data: whiteProfile } = await supabase
      .from("profiles")
      .select("rating")
      .eq("id", pairing.white_id)
      .single();
    const { data: blackProfile } = await supabase
      .from("profiles")
      .select("rating")
      .eq("id", pairing.black_id)
      .single();

    if (whiteProfile && blackProfile) {
      const whiteScore = result === "white" ? 1 : result === "draw" ? 0.5 : 0;
      const [newWhite, newBlack] = updateElo(
        whiteProfile.rating,
        blackProfile.rating,
        whiteScore
      );

      await supabase.from("profiles").update({ rating: newWhite }).eq("id", pairing.white_id);
      await supabase.from("profiles").update({ rating: newBlack }).eq("id", pairing.black_id);

      await supabase.from("ladder_history").insert([
        {
          profile_id: pairing.white_id,
          event_id: eventId,
          rating_before: whiteProfile.rating,
          rating_after: newWhite,
        },
        {
          profile_id: pairing.black_id,
          event_id: eventId,
          rating_before: blackProfile.rating,
          rating_after: newBlack,
        },
      ]);
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
  revalidatePath("/ladder");
}

export async function completeEvent(eventId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("events").update({ status: "completed" }).eq("id", eventId);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
}
