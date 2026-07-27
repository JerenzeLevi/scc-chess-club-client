export type PairingResult = "pending" | "white" | "black" | "draw";

export interface Player {
  id: string;
  score: number;
  rating: number;
}

export interface Pairing {
  whiteId: string;
  blackId: string | null; // null = bye
}

export interface PairingHistoryEntry {
  whiteId: string;
  blackId: string | null;
}
