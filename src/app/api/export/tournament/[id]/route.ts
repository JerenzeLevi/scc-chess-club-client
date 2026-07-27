import { getEvent, getRegistrations, getPairingsForEvent, getRounds } from "@/lib/sheets/data";
import { computeStandings } from "@/lib/pairing/standings";

function toCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return new Response("Not found", { status: 404 });

  const registrations = await getRegistrations(id);
  const pairings = await getPairingsForEvent(id);
  const rounds = await getRounds(id);
  const roundNumberById = new Map(rounds.map((r) => [r.id, r.roundNumber]));

  const standings = computeStandings(
    registrations.map((r) => r.playerName),
    pairings.map((p) => ({
      whiteId: p.whiteName,
      blackId: p.blackName || null,
      result: p.result,
    })),
  );

  const standingsRows = [
    ["Player", "Score"],
    ...standings.map((s) => [s.profileId, String(s.score)]),
  ];

  const pairingRows = [
    ["Round", "White", "Black", "Result"],
    ...pairings.map((p) => [
      roundNumberById.get(p.roundId) ?? "",
      p.whiteName,
      p.blackName || "Bye",
      p.result,
    ]),
  ];

  const csv = [
    `"${event.name} (${event.eventDate})"`,
    "",
    "Standings",
    toCsv(standingsRows),
    "",
    "Pairings",
    toCsv(pairingRows),
  ].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${event.name.replace(/[^a-z0-9]+/gi, "-")}.csv"`,
    },
  });
}
