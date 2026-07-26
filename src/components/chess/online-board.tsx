"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { computeSquareStyles } from "./board-highlights";

interface OnlineBoardProps {
  roomCode: string;
  roomId: string;
  initialFen: string;
  playerColor: "white" | "black" | "spectator";
  hasBothPlayers: boolean;
}

type MoveBroadcast = {
  from: string;
  to: string;
  promotion?: string;
  fen: string;
};

export function OnlineBoard({
  roomCode,
  roomId,
  initialFen,
  playerColor,
  hasBothPlayers,
}: OnlineBoardProps) {
  const supabase = useMemo(() => createClient(), []);
  const startFen = initialFen === "start" ? new Chess().fen() : initialFen;
  const gameRef = useRef(new Chess(startFen));
  const [fen, setFen] = useState(startFen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on("broadcast", { event: "move" }, ({ payload }) => {
        const move = payload as MoveBroadcast;
        try {
          gameRef.current.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion ?? "q",
          });
          setFen(gameRef.current.fen());
          setLastMove({ from: move.from as Square, to: move.to as Square });
          setSelectedSquare(null);
        } catch {
          // Out-of-sync move — the fen field on game_rooms remains the source of truth.
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase]);

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

      supabase.channel(`room:${roomCode}`).send({
        type: "broadcast",
        event: "move",
        payload: { from, to, promotion: "q", fen: newFen },
      });

      supabase.from("game_rooms").update({ fen: newFen }).eq("id", roomId).then();

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
