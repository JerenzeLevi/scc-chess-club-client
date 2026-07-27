"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ref, get, update, onValue } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase/client";
import { getClientId } from "@/lib/play-client-id";
import { OnlineBoard } from "@/components/chess/online-board";
import { Button } from "@/components/ui/button";

interface RoomData {
  fen: string;
  whiteClientId: string | null;
  blackClientId: string | null;
  status: string;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const code = roomCode.toUpperCase();
  const [room, setRoom] = useState<RoomData | null | "loading">("loading");

  useEffect(() => {
    const db = getFirebaseDb();
    const roomRef = ref(db, `rooms/${code}`);
    const clientId = getClientId();

    (async () => {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setRoom(null);
        return;
      }
      const data = snapshot.val() as RoomData;

      if (data.whiteClientId !== clientId && data.blackClientId !== clientId) {
        if (!data.whiteClientId) {
          await update(roomRef, { whiteClientId: clientId });
        } else if (!data.blackClientId) {
          await update(roomRef, { blackClientId: clientId, status: "active" });
        }
      }
    })();

    const unsubscribe = onValue(roomRef, (snapshot) => {
      setRoom(snapshot.exists() ? (snapshot.val() as RoomData) : null);
    });

    return () => unsubscribe();
  }, [code]);

  if (room === "loading") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading room…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Room <span className="font-mono">{code}</span> doesn&apos;t exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/play">Back to play</Link>
        </Button>
      </div>
    );
  }

  const clientId = getClientId();
  const playerColor =
    room.whiteClientId === clientId
      ? "white"
      : room.blackClientId === clientId
        ? "black"
        : "spectator";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Room <span className="font-mono">{code}</span>
      </h1>
      <p className="text-muted-foreground mt-2">Casual game — not rated.</p>

      <div className="mt-8">
        <OnlineBoard
          roomCode={code}
          initialFen={room.fen}
          playerColor={playerColor}
          hasBothPlayers={Boolean(room.whiteClientId && room.blackClientId)}
        />
      </div>
    </div>
  );
}
