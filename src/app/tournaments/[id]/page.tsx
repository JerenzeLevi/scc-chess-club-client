import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/pairing/standings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PairingResult } from "@/lib/supabase/types";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) redirect("/tournaments");

  const { data: registrationsRaw } = await supabase
    .from("event_registrations")
    .select("profiles(id, full_name)")
    .eq("event_id", id);

  const registrations = registrationsRaw as unknown as {
    profiles: { id: string; full_name: string };
  }[];

  const players = (registrations ?? []).map((r) => r.profiles);
  const nameById = new Map(players.map((p) => [p.id, p.full_name]));

  const { data: roundsRaw } = await supabase
    .from("rounds")
    .select("id, round_number, pairings(id, white_id, black_id, result)")
    .eq("event_id", id)
    .order("round_number", { ascending: true });

  const rounds = roundsRaw as unknown as {
    id: string;
    round_number: number;
    pairings: {
      id: string;
      white_id: string | null;
      black_id: string | null;
      result: PairingResult;
    }[];
  }[];

  const allPairings = (rounds ?? []).flatMap((r) => r.pairings ?? []);
  const standings = computeStandings(
    players.map((p) => p.id),
    allPairings.map((p) => ({
      whiteId: p.white_id,
      blackId: p.black_id,
      result: p.result as PairingResult,
    }))
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground mt-1">
            {event.event_date} · {event.format === "swiss" ? "Swiss" : "Round-robin"}
          </p>
        </div>
        <Badge variant={event.status === "completed" ? "default" : "secondary"}>
          {event.status}
        </Badge>
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
                  <TableCell>{nameById.get(s.profileId) ?? s.profileId}</TableCell>
                  <TableCell className="text-right">{s.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-6">
        {(rounds ?? []).map((round) => (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle className="text-base">Round {round.round_number}</CardTitle>
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
                  {(round.pairings ?? []).map((pairing) => (
                    <TableRow key={pairing.id}>
                      <TableCell>{nameById.get(pairing.white_id ?? "") ?? "—"}</TableCell>
                      <TableCell>
                        {pairing.black_id ? nameById.get(pairing.black_id) ?? "—" : "Bye"}
                      </TableCell>
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
