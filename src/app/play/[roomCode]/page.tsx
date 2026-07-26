import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { claimRoomSlot } from "@/app/actions/room";
import { OnlineBoard } from "@/components/chess/online-board";
import { Button } from "@/components/ui/button";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const code = roomCode.toUpperCase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">Sign in to join this room.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  await claimRoomSlot(code);

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("room_code", code)
    .single();

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

  const playerColor =
    room.white_id === profile.id
      ? "white"
      : room.black_id === profile.id
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
          roomId={room.id}
          initialFen={room.fen}
          playerColor={playerColor}
          hasBothPlayers={Boolean(room.white_id && room.black_id)}
        />
      </div>
    </div>
  );
}
