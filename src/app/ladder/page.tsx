import { getPlayers } from "@/lib/sheets/data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LadderPage() {
  const players = await getPlayers();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Club ladder</h1>
          <p className="text-muted-foreground mt-2">
            Ratings update automatically after every rated game.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/api/export/ladder">Export CSV</a>
        </Button>
      </div>

      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.name}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell>{player.name}</TableCell>
              <TableCell className="text-right font-medium">{player.rating}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
