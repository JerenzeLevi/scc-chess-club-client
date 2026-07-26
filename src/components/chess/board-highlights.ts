import type { CSSProperties } from "react";
import type { Chess, Square } from "chess.js";

const DOT_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 26%)",
  borderRadius: "50%",
};

const CAPTURE_DOT_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle, transparent 0 60%, rgba(0,0,0,0.25) 62% 72%, transparent 74%)",
  borderRadius: "50%",
};

const SELECTED_STYLE: CSSProperties = {
  background: "rgba(255, 255, 0, 0.4)",
};

const LAST_MOVE_STYLE: CSSProperties = {
  background: "rgba(155, 199, 0, 0.41)",
};

const CHECK_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle, rgba(255,0,0,0.55) 0%, rgba(255,0,0,0.25) 55%, transparent 80%)",
};

export function findKingSquare(game: Chess, color: "w" | "b"): Square | null {
  const board = game.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.type === "k" && piece.color === color) {
        return piece.square;
      }
    }
  }
  return null;
}

export function computeSquareStyles(
  game: Chess,
  selectedSquare: Square | null,
  lastMove: { from: Square; to: Square } | null
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  if (lastMove) {
    styles[lastMove.from] = { ...styles[lastMove.from], ...LAST_MOVE_STYLE };
    styles[lastMove.to] = { ...styles[lastMove.to], ...LAST_MOVE_STYLE };
  }

  if (game.isCheck()) {
    const kingSquare = findKingSquare(game, game.turn());
    if (kingSquare) {
      styles[kingSquare] = { ...styles[kingSquare], ...CHECK_STYLE };
    }
  }

  if (selectedSquare) {
    styles[selectedSquare] = { ...styles[selectedSquare], ...SELECTED_STYLE };
    const moves = game.moves({ square: selectedSquare, verbose: true });
    for (const move of moves) {
      styles[move.to] = {
        ...styles[move.to],
        ...(move.captured ? CAPTURE_DOT_STYLE : DOT_STYLE),
      };
    }
  }

  return styles;
}
