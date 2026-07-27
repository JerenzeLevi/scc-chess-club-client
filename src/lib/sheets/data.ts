import { randomUUID } from "crypto";
import { readTab, appendRow, writeTab, updateRow } from "@/lib/sheets/client";
import { TABS, HEADERS } from "@/lib/sheets/schema";
import type {
  AdminRow,
  AnnouncementRow,
  OfficerRow,
  EventRow,
  PlayerRow,
  RegistrationRow,
  RoundRow,
  PairingRow,
  LadderHistoryRow,
} from "@/lib/sheets/schema";

// ---------- Admins ----------

export async function getAdmins() {
  return readTab<AdminRow>(TABS.admins);
}

export async function addAdmin(email: string, role: "superadmin" | "admin") {
  const admins = await getAdmins();
  if (admins.some((a) => a.email.toLowerCase() === email.toLowerCase())) return;
  await appendRow(TABS.admins, [...HEADERS.admins], {
    email,
    role,
    addedAt: new Date().toISOString(),
  });
}

export async function removeAdmin(email: string) {
  const admins = await getAdmins();
  const filtered = admins.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
  await writeTab(TABS.admins, [...HEADERS.admins], filtered);
}

// ---------- Announcements ----------

export async function getAnnouncements() {
  const rows = await readTab<AnnouncementRow>(TABS.announcements);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addAnnouncement(title: string, body: string) {
  await appendRow(TABS.announcements, [...HEADERS.announcements], {
    id: randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
  });
}

export async function removeAnnouncement(id: string) {
  const rows = await readTab<AnnouncementRow>(TABS.announcements);
  await writeTab(
    TABS.announcements,
    [...HEADERS.announcements],
    rows.filter((r) => r.id !== id),
  );
}

// ---------- Officers ----------

export async function getOfficers() {
  const rows = await readTab<OfficerRow>(TABS.officers);
  return rows.sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
}

export async function addOfficer(role: string) {
  const rows = await getOfficers();
  const maxSort = rows.reduce((m, r) => Math.max(m, Number(r.sortOrder) || 0), -1);
  await appendRow(TABS.officers, [...HEADERS.officers], {
    id: randomUUID(),
    role,
    name: "",
    photoUrl: "",
    sortOrder: maxSort + 1,
  });
}

export async function updateOfficer(
  id: string,
  updates: { role?: string; name?: string; photoUrl?: string },
) {
  const rows = await readTab<OfficerRow>(TABS.officers);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  const updated = { ...rows[index], ...updates };
  await updateRow(TABS.officers, [...HEADERS.officers], index, updated);
}

export async function removeOfficer(id: string) {
  const rows = await readTab<OfficerRow>(TABS.officers);
  await writeTab(TABS.officers, [...HEADERS.officers], rows.filter((r) => r.id !== id));
}

// ---------- Players / Ladder ----------

const DEFAULT_RATING = 1200;

export async function getPlayers() {
  const rows = await readTab<PlayerRow>(TABS.players);
  return rows.sort((a, b) => Number(b.rating) - Number(a.rating));
}

export async function getOrCreatePlayer(name: string) {
  const rows = await readTab<PlayerRow>(TABS.players);
  const existing = rows.find((r) => r.name === name);
  if (existing) return existing;
  const created: PlayerRow = { name, rating: String(DEFAULT_RATING) };
  await appendRow(TABS.players, [...HEADERS.players], created);
  return created;
}

export async function setPlayerRating(name: string, rating: number) {
  const rows = await readTab<PlayerRow>(TABS.players);
  const index = rows.findIndex((r) => r.name === name);
  if (index === -1) {
    await appendRow(TABS.players, [...HEADERS.players], { name, rating: String(rating) });
    return;
  }
  await updateRow(TABS.players, [...HEADERS.players], index, { name, rating: String(rating) });
}

export async function addLadderHistory(entry: {
  playerName: string;
  eventId: string;
  ratingBefore: number;
  ratingAfter: number;
}) {
  await appendRow(TABS.ladderHistory, [...HEADERS.ladderHistory], {
    id: randomUUID(),
    playerName: entry.playerName,
    eventId: entry.eventId,
    ratingBefore: entry.ratingBefore,
    ratingAfter: entry.ratingAfter,
    createdAt: new Date().toISOString(),
  });
}

// ---------- Events ----------

export async function getEvents() {
  const rows = await readTab<EventRow>(TABS.events);
  return rows.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

export async function getEvent(id: string) {
  const rows = await readTab<EventRow>(TABS.events);
  return rows.find((r) => r.id === id) ?? null;
}

export async function createEvent(input: {
  name: string;
  eventDate: string;
  format: "swiss" | "round_robin";
  createdBy: string;
}) {
  const id = randomUUID();
  await appendRow(TABS.events, [...HEADERS.events], {
    id,
    name: input.name,
    eventDate: input.eventDate,
    format: input.format,
    status: "draft",
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function setEventStatus(id: string, status: EventRow["status"]) {
  const rows = await readTab<EventRow>(TABS.events);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  await updateRow(TABS.events, [...HEADERS.events], index, { ...rows[index], status });
}

// ---------- Registrations ----------

export async function getRegistrations(eventId: string) {
  const rows = await readTab<RegistrationRow>(TABS.registrations);
  return rows.filter((r) => r.eventId === eventId);
}

export async function registerPlayer(eventId: string, playerName: string) {
  await getOrCreatePlayer(playerName);
  const rows = await getRegistrations(eventId);
  if (rows.some((r) => r.playerName === playerName)) return;
  await appendRow(TABS.registrations, [...HEADERS.registrations], { eventId, playerName });
}

export async function unregisterPlayer(eventId: string, playerName: string) {
  const rows = await readTab<RegistrationRow>(TABS.registrations);
  await writeTab(
    TABS.registrations,
    [...HEADERS.registrations],
    rows.filter((r) => !(r.eventId === eventId && r.playerName === playerName)),
  );
}

// ---------- Rounds / Pairings ----------

export async function getRounds(eventId: string) {
  const rows = await readTab<RoundRow>(TABS.rounds);
  return rows
    .filter((r) => r.eventId === eventId)
    .sort((a, b) => Number(a.roundNumber) - Number(b.roundNumber));
}

export async function getPairingsForEvent(eventId: string) {
  const rows = await readTab<PairingRow>(TABS.pairings);
  return rows.filter((r) => r.eventId === eventId);
}

export async function createRoundWithPairings(
  eventId: string,
  roundNumber: number,
  pairings: { whiteName: string; blackName: string | null }[],
) {
  const roundId = randomUUID();
  await appendRow(TABS.rounds, [...HEADERS.rounds], {
    id: roundId,
    eventId,
    roundNumber,
  });

  for (const p of pairings) {
    await appendRow(TABS.pairings, [...HEADERS.pairings], {
      id: randomUUID(),
      roundId,
      eventId,
      whiteName: p.whiteName,
      blackName: p.blackName ?? "",
      result: p.blackName ? "pending" : "white", // byes auto-score as a win
    });
  }

  return roundId;
}

export async function setPairingResult(
  pairingId: string,
  result: PairingRow["result"],
) {
  const rows = await readTab<PairingRow>(TABS.pairings);
  const index = rows.findIndex((r) => r.id === pairingId);
  if (index === -1) return null;
  const previous = rows[index];
  await updateRow(TABS.pairings, [...HEADERS.pairings], index, { ...previous, result });
  return previous;
}
