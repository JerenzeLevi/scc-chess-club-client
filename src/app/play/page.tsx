import { LocalBoard } from "@/components/chess/local-board";
import { RoomControls } from "@/components/chess/room-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Play</h1>
      <p className="text-muted-foreground mt-2">
        Free-time play — casual games, not rated. No sign-in needed.
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
          <RoomControls />
        </TabsContent>
      </Tabs>
    </div>
  );
}
