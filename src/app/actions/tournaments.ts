"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import * as data from "@/lib/sheets/data";
import { generateSwissPairings } from "@/lib/pairing/swiss";
import { generateRoundRobinRound } from "@/lib/pairing/roundRobin";
import { computeStandings } from "@/lib/pairing/standings";
import { updateElo } from "@/lib/elo";
import type { PairingResult } from "@/lib/pairing/types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "");
  const format = String(formData.get("format") ?? "swiss") as
    | "swiss"
    | "round_robin";

  const id = await data.createEvent({ name, eventDate, format, createdBy: admin.email });

  revalidatePath("/admin");
  redirect(`/admin/events/${id}`);
}

export async function registerPlayer(eventId: string, playerName: string) {
  await requireAdmin();
  const name = playerName.trim();
  if (!name) return;
  await data.registerPlayer(eventId, name);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function registerPlayersBulk(eventId: string, formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("names") ?? "");
  const names = raw
    .split(/\r?\n|,/)
    .map((n) => n.trim())
    .filter(Boolean);

  for (const name of names) {
    await data.registerPlayer(eventId, name);
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function unregisterPlayer(eventId: string, playerName: string) {
  await requireAdmin();
  await data.unregisterPlayer(eventId, playerName);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function generateNextRound(eventId: string) {
  await requireAdmin();

  const event = await data.getEvent(eventId);
  if (!event) redirect("/admin");

  const registrations = await data.getRegistrations(eventId);
  const players = await Promise.all(
    registrations.map(async (r) => {
      const player = await data.getOrCreatePlayer(r.playerName);
      return { id: r.playerName, rating: Number(player.rating), score: 0 };
    }),
  );

  if (players.length < 2) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent("Need at least 2 registered players")}`,
    );
  }

  const rounds = await data.getRounds(eventId);
  const allPairings = await data.getPairingsForEvent(eventId);
  const nextRoundNumber = rounds.length + 1;

  const allPairingsCamel = allPairings.map((p) => ({
    whiteId: p.whiteName,
    blackId: p.blackName || null,
    result: p.result,
  }));

  let newPairings: { whiteId: string; blackId: string | null }[];

  if (event.format === "round_robin") {
    newPairings = generateRoundRobinRound(players, nextRoundNumber);
  } else {
    const standings = computeStandings(
      players.map((p) => p.id),
      allPairingsCamel,
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
        .map((p) => ({ whiteId: p.whiteId as string, blackId: p.blackId })),
    );
  }

  await data.createRoundWithPairings(
    eventId,
    nextRoundNumber,
    newPairings.map((p) => ({ whiteName: p.whiteId, blackName: p.blackId })),
  );

  if (event.status === "draft") {
    await data.setEventStatus(eventId, "active");
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
}

export async function submitResult(
  pairingId: string,
  eventId: string,
  result: PairingResult,
) {
  await requireAdmin();

  const previous = await data.setPairingResult(pairingId, result);
  if (!previous) redirect(`/admin/events/${eventId}`);

  if (
    previous.whiteName &&
    previous.blackName &&
    result !== "pending" &&
    previous.result === "pending"
  ) {
    const whitePlayer = await data.getOrCreatePlayer(previous.whiteName);
    const blackPlayer = await data.getOrCreatePlayer(previous.blackName);

    const whiteScore = result === "white" ? 1 : result === "draw" ? 0.5 : 0;
    const [newWhite, newBlack] = updateElo(
      Number(whitePlayer.rating),
      Number(blackPlayer.rating),
      whiteScore,
    );

    await data.setPlayerRating(previous.whiteName, newWhite);
    await data.setPlayerRating(previous.blackName, newBlack);

    await data.addLadderHistory({
      playerName: previous.whiteName,
      eventId,
      ratingBefore: Number(whitePlayer.rating),
      ratingAfter: newWhite,
    });
    await data.addLadderHistory({
      playerName: previous.blackName,
      eventId,
      ratingBefore: Number(blackPlayer.rating),
      ratingAfter: newBlack,
    });
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
  revalidatePath("/ladder");
}

export async function completeEvent(eventId: string) {
  await requireAdmin();
  await data.setEventStatus(eventId, "completed");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/tournaments/${eventId}`);
}
