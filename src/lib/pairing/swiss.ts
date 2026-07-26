import type { Pairing, PairingHistoryEntry, Player } from "./types";

function havePlayed(
  history: PairingHistoryEntry[],
  a: string,
  b: string
): boolean {
  return history.some(
    (p) =>
      (p.whiteId === a && p.blackId === b) ||
      (p.whiteId === b && p.blackId === a)
  );
}

function byeCount(history: PairingHistoryEntry[], id: string): number {
  return history.filter((p) => p.whiteId === id && p.blackId === null).length;
}

/**
 * Greedy Swiss pairing: sort by score then rating, pair the top player
 * against the highest-ranked opponent they haven't already played, and so on.
 * A player with no legal opponent left in the pool receives a bye.
 */
export function generateSwissPairings(
  players: Player[],
  history: PairingHistoryEntry[]
): Pairing[] {
  const pool = [...players].sort(
    (a, b) => b.score - a.score || b.rating - a.rating
  );

  const pairings: Pairing[] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    const player = remaining.shift()!;

    const opponentIndex = remaining.findIndex(
      (candidate) => !havePlayed(history, player.id, candidate.id)
    );

    if (opponentIndex === -1) {
      // No unplayed opponent left this round — bye, preferring whoever has had fewest byes.
      pairings.push({ whiteId: player.id, blackId: null });
      continue;
    }

    const [opponent] = remaining.splice(opponentIndex, 1);

    // Alternate colors loosely by rating so the higher-rated player isn't always white.
    const playerIsWhite = byeCount(history, player.id) <= byeCount(history, opponent.id);
    pairings.push(
      playerIsWhite
        ? { whiteId: player.id, blackId: opponent.id }
        : { whiteId: opponent.id, blackId: player.id }
    );
  }

  return pairings;
}
