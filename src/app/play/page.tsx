import { getCurrentProfile } from "@/lib/auth";
import { createRoom, joinRoomByCode } from "@/app/actions/play";
import { LocalBoard } from "@/components/chess/local-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Play</h1>
      <p className="text-muted-foreground mt-2">
        Free-time play — casual games, not rated on the club ladder.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="local" className="mt-8">
        <TabsList>
          <TabsTrigger value="local">Pass-and-play</TabsTrigger>
          <TabsTrigger value="online">Play with a friend</TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="mt-6">
          <LocalBoard />
        </TabsContent>

        <TabsContent value="online" className="mt-6">
          {profile ? (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Start a game</CardTitle>
                  <CardDescription>
                    Create a room and share the code with whoever you&apos;re
                    playing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createRoom}>
                    <Button type="submit">Create room</Button>
                  </form>
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
                  <form action={joinRoomByCode} className="flex gap-3">
                    <Input
                      name="code"
                      placeholder="ROOM CODE"
                      className="max-w-40 uppercase"
                      maxLength={5}
                    />
                    <Button type="submit">Join</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sign in to create or join an online room.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
