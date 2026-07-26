import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  registerPlayer,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PairingResult } from "@/lib/supabase/types";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (!event) redirect("/admin");

  const { data: registrationsRaw } = await supabase
    .from("event_registrations")
    .select("profile_id, profiles(id, full_name, rating)")
    .eq("event_id", id);

  const registrations = registrationsRaw as unknown as {
    profile_id: string;
    profiles: { id: string; full_name: string; rating: number };
  }[];

  const registeredPlayers = (registrations ?? []).map((r) => r.profiles);
  const registeredIds = new Set(registeredPlayers.map((p) => p.id));

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");
  const unregisteredProfiles = (allProfiles ?? []).filter(
    (p) => !registeredIds.has(p.id)
  );

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

  const nameById = new Map(
    (allProfiles ?? []).map((p) => [p.id, p.full_name])
  );

  const allPairings = (rounds ?? []).flatMap((r) => r.pairings ?? []);
  const standings = computeStandings(
    registeredPlayers.map((p) => p.id),
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
          <h1 className="text-3xl font-semibold tracking-tight">
            {event.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {event.event_date} ·{" "}
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
            {registeredPlayers.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {p.full_name} <span className="text-muted-foreground">({p.rating})</span>
                </span>
                <form action={unregisterPlayer.bind(null, id, p.id)}>
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

          {unregisteredProfiles.length > 0 && (
            <form
              action={async (formData: FormData) => {
                "use server";
                const profileId = String(formData.get("profileId"));
                await registerPlayer(id, profileId);
              }}
              className="flex items-end gap-3"
            >
              <div className="flex-1 space-y-2">
                <Select name="profileId" defaultValue={unregisteredProfiles[0]?.id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {unregisteredProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Register</Button>
            </form>
          )}
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
                  <TableCell>{nameById.get(s.profileId) ?? s.profileId}</TableCell>
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
                    <TableHead className="w-48">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(round.pairings ?? []).map((pairing) => (
                    <TableRow key={pairing.id}>
                      <TableCell>{nameById.get(pairing.white_id ?? "") ?? "—"}</TableCell>
                      <TableCell>
                        {pairing.black_id ? nameById.get(pairing.black_id) ?? "—" : "Bye"}
                      </TableCell>
                      <TableCell>
                        {pairing.black_id ? (
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const result = String(
                                formData.get("result")
                              ) as PairingResult;
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
