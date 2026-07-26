import { describe, expect, it } from "vitest";
import { generateRoundRobinSchedule } from "./roundRobin";
import type { Player } from "./types";

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    score: 0,
    rating: 1200,
  }));
}

describe("generateRoundRobinSchedule", () => {
  it("pairs every player against every other player exactly once (even count)", () => {
    const players = makePlayers(4);
    const schedule = generateRoundRobinSchedule(players);

    expect(schedule).toHaveLength(3); // n-1 rounds

    const matchups = new Set<string>();
    for (const round of schedule) {
      for (const pairing of round) {
        expect(pairing.blackId).not.toBeNull();
        const key = [pairing.whiteId, pairing.blackId].sort().join("-");
        expect(matchups.has(key)).toBe(false);
        matchups.add(key);
      }
    }

    expect(matchups.size).toBe((4 * 3) / 2);
  });

  it("gives exactly one bye per round for an odd count", () => {
    const players = makePlayers(5);
    const schedule = generateRoundRobinSchedule(players);

    expect(schedule).toHaveLength(5); // n rounds when n is odd

    for (const round of schedule) {
      const byes = round.filter((p) => p.blackId === null);
      expect(byes).toHaveLength(1);
    }
  });
});
