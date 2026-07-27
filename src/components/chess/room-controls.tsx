"use client";

import { useRouter } from "next/navigation";
import { ref, set } from "firebase/database";
import { getFirebaseDb } from "@/lib/firebase/client";
import { getClientId, generateRoomCode } from "@/lib/play-client-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export function RoomControls() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  async function createRoom() {
    const code = generateRoomCode();
    const db = getFirebaseDb();
    await set(ref(db, `rooms/${code}`), {
      fen: "start",
      whiteClientId: getClientId(),
      blackClientId: null,
      status: "waiting",
      createdAt: Date.now(),
    });
    router.push(`/play/${code}`);
  }

  function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code) router.push(`/play/${code}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Start a game</CardTitle>
          <CardDescription>
            Create a room and share the code with whoever you&apos;re playing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createRoom}>Create room</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join a game</CardTitle>
          <CardDescription>
            Enter a room code someone shared with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={joinRoom} className="flex gap-3">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ROOM CODE"
              className="max-w-40 uppercase"
              maxLength={5}
            />
            <Button type="submit">Join</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
