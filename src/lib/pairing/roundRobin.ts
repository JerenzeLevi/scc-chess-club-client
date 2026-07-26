import type { Pairing, Player } from "./types";

const BYE = null;

/**
 * Standard circle-method round-robin schedule: fixes one player, rotates the
 * rest each round. Returns one round of pairings per array entry, covering
 * every player against every other player exactly once.
 */
export function generateRoundRobinSchedule(players: Player[]): Pairing[][] {
  const ids: (string | null)[] = players.map((p) => p.id);
  if (ids.length % 2 !== 0) ids.push(BYE);

  const rounds = ids.length - 1;
  const half = ids.length / 2;
  const rotation = [...ids];
  const schedule: Pairing[][] = [];

  for (let round = 0; round < rounds; round++) {
    const roundPairings: Pairing[] = [];

    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[rotation.length - 1 - i];

      if (a === BYE) {
        if (b !== null) roundPairings.push({ whiteId: b, blackId: null });
        continue;
      }
      if (b === BYE) {
        roundPairings.push({ whiteId: a, blackId: null });
        continue;
      }

      // Alternate who gets white each round for fairness.
      const aIsWhite = round % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
      roundPairings.push(
        aIsWhite ? { whiteId: a, blackId: b } : { whiteId: b, blackId: a }
      );
    }

    schedule.push(roundPairings);

    // Rotate all but the first fixed element.
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop()!);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  return schedule;
}

/** Generate just the next round's pairings for an in-progress round robin. */
export function generateRoundRobinRound(
  players: Player[],
  roundNumber: number
): Pairing[] {
  const schedule = generateRoundRobinSchedule(players);
  return schedule[roundNumber - 1] ?? [];
}
