import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getEvent, getRegistrations, getRounds, getPairingsForEvent } from "@/lib/sheets/data";
import {
  registerPlayer,
  registerPlayersBulk,
  unregisterPlayer,
  generateNextRound,
  submitResult,
  completeEvent,
} from "@/app/actions/tournaments";
import { computeStandings } from "@/lib/pairing/standings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PairingRow } from "@/lib/sheets/schema";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const { error } = await searchParams;

  const event = await getEvent(id);
  if (!event) redirect("/admin");

  const registrations = await getRegistrations(id);
  const registeredPlayers = registrations.map((r) => r.playerName);

  const rounds = await getRounds(id);
  const pairings = await getPairingsForEvent(id);
  const pairingsByRound = new Map(rounds.map((r) => [r.id, pairings.filter((p) => p.roundId === r.id)]));

  const standings = computeStandings(
    registeredPlayers,
    pairings.map((p) => ({
      whiteId: p.whiteName,
      blackId: p.blackName || null,
      result: p.result,
    })),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {event.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {event.eventDate} ·{" "}
            {event.format === "swiss" ? "Swiss" : "Round-robin"}
          </p>
        </div>
        <Badge variant={event.status === "completed" ? "default" : "secondary"}>
          {event.status}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Registered players ({registeredPlayers.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {registeredPlayers.map((name) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span>{name}</span>
                <form action={unregisterPlayer.bind(null, id, name)}>
                  <Button variant="ghost" size="sm" type="submit">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
            {registeredPlayers.length === 0 && (
              <p className="text-muted-foreground text-sm">No players registered yet.</p>
            )}
          </ul>

          <form
            action={async (formData: FormData) => {
              "use server";
              const name = String(formData.get("playerName"));
              await registerPlayer(id, name);
            }}
            className="flex items-end gap-3"
          >
            <div className="flex-1 space-y-2">
              <Input name="playerName" placeholder="Player name" required />
            </div>
            <Button type="submit">Register</Button>
          </form>

          <form action={registerPlayersBulk.bind(null, id)} className="flex flex-col gap-2 border-t pt-4">
            <label htmlFor="names" className="text-sm font-medium">
              Bulk import
            </label>
            <p className="text-muted-foreground text-xs">
              Paste a column of names copied from Google Sheets or Excel — one per line.
            </p>
            <textarea
              id="names"
              name="names"
              rows={4}
              className="border-input bg-transparent rounded-md border px-3 py-2 text-sm"
              placeholder={"Jane Doe\nJohn Smith"}
            />
            <Button type="submit" variant="outline" className="w-fit">
              Import players
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s) => (
                <TableRow key={s.profileId}>
                  <TableCell>{s.profileId}</TableCell>
                  <TableCell className="text-right">{s.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Rounds</h2>
        <div className="flex gap-3">
          <form action={generateNextRound.bind(null, id)}>
            <Button type="submit" disabled={event.status === "completed"}>
              Generate next round
            </Button>
          </form>
          {event.status !== "completed" && (
            <form action={completeEvent.bind(null, id)}>
              <Button type="submit" variant="outline">
                Mark completed
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6">
        {rounds.map((round) => (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle className="text-base">Round {round.roundNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>White</TableHead>
                    <TableHead>Black</TableHead>
                    <TableHead className="w-48">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pairingsByRound.get(round.id) ?? []).map((pairing) => (
                    <TableRow key={pairing.id}>
                      <TableCell>{pairing.whiteName || "—"}</TableCell>
                      <TableCell>{pairing.blackName || "Bye"}</TableCell>
                      <TableCell>
                        {pairing.blackName ? (
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const result = String(
                                formData.get("result"),
                              ) as PairingRow["result"];
                              await submitResult(pairing.id, id, result);
                            }}
                          >
                            <Select name="result" defaultValue={pairing.result}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="white">White wins</SelectItem>
                                <SelectItem value="black">Black wins</SelectItem>
                                <SelectItem value="draw">Draw</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="submit" size="sm" variant="ghost" className="mt-1">
                              Save
                            </Button>
                          </form>
                        ) : (
                          <Badge variant="secondary">Bye</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
