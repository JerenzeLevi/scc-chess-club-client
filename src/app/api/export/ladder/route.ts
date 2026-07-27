import { getPlayers } from "@/lib/sheets/data";

function toCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export async function GET() {
  const players = await getPlayers();
  const rows = [
    ["Rank", "Player", "Rating"],
    ...players.map((p, i) => [String(i + 1), p.name, p.rating]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="ladder.csv"',
    },
  });
}
