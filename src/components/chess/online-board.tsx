"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { ref, onValue, update } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { computeSquareStyles } from "./board-highlights";

interface OnlineBoardProps {
  roomCode: string;
  initialFen: string;
  playerColor: "white" | "black" | "spectator";
  hasBothPlayers: boolean;
}

export function OnlineBoard({
  roomCode,
  initialFen,
  playerColor,
  hasBothPlayers,
}: OnlineBoardProps) {
  const db = useMemo(() => getFirebaseDb(), []);
  const startFen = initialFen === "start" ? new Chess().fen() : initialFen;
  const gameRef = useRef(new Chess(startFen));
  const [fen, setFen] = useState(startFen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );

  useEffect(() => {
    const fenRef = ref(db, `rooms/${roomCode}/fen`);
    const unsubscribe = onValue(fenRef, (snapshot) => {
      const remoteFen = snapshot.val() as string | null;
      if (!remoteFen || remoteFen === "start") return;
      if (remoteFen === gameRef.current.fen()) return;

      gameRef.current = new Chess(remoteFen);
      setFen(remoteFen);
      setSelectedSquare(null);
    });

    return () => unsubscribe();
  }, [roomCode, db]);

  const status = useMemo(() => {
    const game = new Chess(fen);
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "black" : "white"} wins`;
    if (game.isStalemate()) return "Stalemate";
    if (game.isDraw()) return "Draw";
    if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} is in check`;
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  }, [fen]);

  const squareStyles = useMemo(
    () => computeSquareStyles(new Chess(fen), selectedSquare, lastMove),
    [fen, selectedSquare, lastMove]
  );

  function attemptMove(from: Square, to: Square) {
    if (playerColor === "spectator") return false;

    const game = gameRef.current;
    const turnColor = game.turn() === "w" ? "white" : "black";
    if (turnColor !== playerColor) return false;

    try {
      const move = game.move({ from, to, promotion: "q" });
      if (!move) return false;

      const newFen = game.fen();
      setFen(newFen);
      setLastMove({ from, to });
      setSelectedSquare(null);

      update(ref(db, `rooms/${roomCode}`), { fen: newFen });

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
    if (playerColor === "spectator") return;
    const sq = square as Square;
    const game = gameRef.current;

    if (selectedSquare) {
      if (sq === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      if (attemptMove(selectedSquare, sq)) return;
    }

    const piece = game.get(sq);
    const turnColor = game.turn() === "w" ? "white" : "black";
    if (piece && piece.color === game.turn() && turnColor === playerColor) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{status}</Badge>
        <Badge variant="outline">You are {playerColor}</Badge>
      </div>

      {!hasBothPlayers && (
        <Card className="w-full max-w-md">
          <CardContent className="text-muted-foreground py-4 text-center text-sm">
            Waiting for a second player to join with code{" "}
            <span className="text-foreground font-mono">{roomCode}</span>.
          </CardContent>
        </Card>
      )}

      <div className="w-full max-w-md">
        <Chessboard
          options={{
            position: fen,
            onPieceDrop,
            onSquareClick,
            squareStyles,
            boardOrientation: playerColor === "black" ? "black" : "white",
          }}
        />
      </div>
    </div>
  );
}
