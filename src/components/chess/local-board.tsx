"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeSquareStyles } from "./board-highlights";

export function LocalBoard() {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );

  const status = useMemo(() => {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "black" : "white"} wins`;
    if (game.isStalemate()) return "Stalemate";
    if (game.isDraw()) return "Draw";
    if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} is in check`;
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  }, [game]);

  const squareStyles = useMemo(
    () => computeSquareStyles(game, selectedSquare, lastMove),
    [game, selectedSquare, lastMove]
  );

  function attemptMove(from: Square, to: Square) {
    try {
      const move = game.move({ from, to, promotion: "q" });
      if (!move) return false;
      setFen(game.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);
      return true;
    } catch {
      return false;
    }
  }

  function onPieceDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }) {
    if (!targetSquare) return false;
    return attemptMove(sourceSquare as Square, targetSquare as Square);
  }

  function onSquareClick({ square }: { square: string }) {
    const sq = square as Square;

    if (selectedSquare) {
      if (sq === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      if (attemptMove(selectedSquare, sq)) return;
    }

    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  }

  function reset() {
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setSelectedSquare(null);
    setLastMove(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{status}</Badge>
        <Button size="sm" variant="outline" onClick={reset}>
          Reset board
        </Button>
      </div>
      <div className="w-full max-w-md">
        <Chessboard
          options={{ position: fen, onPieceDrop, onSquareClick, squareStyles }}
        />
      </div>
    </div>
  );
}
