import { redirect } from "next/navigation";
import { getEvent, getRegistrations, getRounds, getPairingsForEvent } from "@/lib/sheets/data";
import { computeStandings } from "@/lib/pairing/standings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) redirect("/tournaments");

  const registrations = await getRegistrations(id);
  const players = registrations.map((r) => r.playerName);

  const rounds = await getRounds(id);
  const pairings = await getPairingsForEvent(id);
  const pairingsByRound = new Map(rounds.map((r) => [r.id, pairings.filter((p) => p.roundId === r.id)]));

  const standings = computeStandings(
    players,
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
          <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground mt-1">
            {event.eventDate} · {event.format === "swiss" ? "Swiss" : "Round-robin"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={event.status === "completed" ? "default" : "secondary"}>
            {event.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export/tournament/${id}`}>Export CSV</a>
          </Button>
        </div>
      </div>

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

      <div className="mt-8 flex flex-col gap-6">
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
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pairingsByRound.get(round.id) ?? []).map((pairing) => (
                    <TableRow key={pairing.id}>
                      <TableCell>{pairing.whiteName || "—"}</TableCell>
                      <TableCell>{pairing.blackName || "Bye"}</TableCell>
                      <TableCell>{pairing.result}</TableCell>
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
