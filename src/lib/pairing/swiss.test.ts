import { describe, expect, it } from "vitest";
import { generateSwissPairings } from "./swiss";
import type { Player } from "./types";

const players: Player[] = [
  { id: "a", score: 2, rating: 1500 },
  { id: "b", score: 2, rating: 1400 },
  { id: "c", score: 1, rating: 1300 },
  { id: "d", score: 1, rating: 1200 },
  { id: "e", score: 0, rating: 1100 },
];

describe("generateSwissPairings", () => {
  it("pairs every player exactly once, odd count gets one bye", () => {
    const pairings = generateSwissPairings(players, []);
    const seen = new Set<string>();

    for (const p of pairings) {
      seen.add(p.whiteId);
      if (p.blackId) seen.add(p.blackId);
    }

    expect(seen.size).toBe(players.length);
    expect(pairings.filter((p) => p.blackId === null)).toHaveLength(1);
  });

  it("avoids rematches when a legal opponent exists", () => {
    const history = [{ whiteId: "a", blackId: "b" }];
    const pairings = generateSwissPairings(players, history);

    const rematch = pairings.find(
      (p) =>
        (p.whiteId === "a" && p.blackId === "b") ||
        (p.whiteId === "b" && p.blackId === "a")
    );

    expect(rematch).toBeUndefined();
  });
});
