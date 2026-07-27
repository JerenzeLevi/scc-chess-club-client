import type { PairingResult } from "@/lib/pairing/types";

export interface StandingsPairing {
  whiteId: string | null;
  blackId: string | null;
  result: PairingResult;
}

export interface Standing {
  profileId: string;
  score: number;
}

/** Win = 1, draw = 0.5, loss = 0, bye = 1 (counts as a win with no opponent). */
export function computeStandings(
  playerIds: string[],
  pairings: StandingsPairing[]
): Standing[] {
  const scores = new Map(playerIds.map((id) => [id, 0]));

  for (const pairing of pairings) {
    if (!pairing.whiteId) continue;

    if (pairing.blackId === null) {
      // Bye.
      scores.set(pairing.whiteId, (scores.get(pairing.whiteId) ?? 0) + 1);
      continue;
    }

    if (pairing.result === "white") {
      scores.set(pairing.whiteId, (scores.get(pairing.whiteId) ?? 0) + 1);
    } else if (pairing.result === "black") {
      scores.set(pairing.blackId, (scores.get(pairing.blackId) ?? 0) + 1);
    } else if (pairing.result === "draw") {
      scores.set(pairing.whiteId, (scores.get(pairing.whiteId) ?? 0) + 0.5);
      scores.set(pairing.blackId, (scores.get(pairing.blackId) ?? 0) + 0.5);
    }
  }

  return [...scores.entries()]
    .map(([profileId, score]) => ({ profileId, score }))
    .sort((a, b) => b.score - a.score);
}
