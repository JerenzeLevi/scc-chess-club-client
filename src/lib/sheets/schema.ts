export const TABS = {
  admins: "Admins",
  announcements: "Announcements",
  officers: "Officers",
  events: "Events",
  players: "Players",
  registrations: "Registrations",
  rounds: "Rounds",
  pairings: "Pairings",
  ladderHistory: "LadderHistory",
} as const;

export const HEADERS = {
  admins: ["email", "role", "addedAt"],
  announcements: ["id", "title", "body", "createdAt"],
  officers: ["id", "role", "name", "photoUrl", "sortOrder"],
  events: ["id", "name", "eventDate", "format", "status", "createdBy", "createdAt"],
  players: ["name", "rating"],
  registrations: ["eventId", "playerName"],
  rounds: ["id", "eventId", "roundNumber"],
  pairings: ["id", "roundId", "eventId", "whiteName", "blackName", "result"],
  ladderHistory: ["id", "playerName", "eventId", "ratingBefore", "ratingAfter", "createdAt"],
} as const;

export type AdminRow = { email: string; role: "superadmin" | "admin"; addedAt: string };
export type AnnouncementRow = { id: string; title: string; body: string; createdAt: string };
export type OfficerRow = {
  id: string;
  role: string;
  name: string;
  photoUrl: string;
  sortOrder: string;
};
export type EventRow = {
  id: string;
  name: string;
  eventDate: string;
  format: "swiss" | "round_robin";
  status: "draft" | "active" | "completed";
  createdBy: string;
  createdAt: string;
};
export type PlayerRow = { name: string; rating: string };
export type RegistrationRow = { eventId: string; playerName: string };
export type RoundRow = { id: string; eventId: string; roundNumber: string };
import type { PairingResult } from "@/lib/pairing/types";

export type PairingRow = {
  id: string;
  roundId: string;
  eventId: string;
  whiteName: string;
  blackName: string;
  result: PairingResult;
};
export type LadderHistoryRow = {
  id: string;
  playerName: string;
  eventId: string;
  ratingBefore: string;
  ratingAfter: string;
  createdAt: string;
};
