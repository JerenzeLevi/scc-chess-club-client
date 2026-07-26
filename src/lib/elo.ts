const K = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/** Returns [newWhiteRating, newBlackRating] for a single game. score is from white's perspective: 1 win, 0.5 draw, 0 loss. */
export function updateElo(
  whiteRating: number,
  blackRating: number,
  whiteScore: 1 | 0.5 | 0
): [number, number] {
  const expectedWhite = expectedScore(whiteRating, blackRating);
  const expectedBlack = 1 - expectedWhite;
  const blackScore = 1 - whiteScore;

  const newWhite = Math.round(whiteRating + K * (whiteScore - expectedWhite));
  const newBlack = Math.round(blackRating + K * (blackScore - expectedBlack));

  return [newWhite, newBlack];
}
