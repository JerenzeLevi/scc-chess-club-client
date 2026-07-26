import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LadderPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, rating")
    .order("rating", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Club ladder</h1>
      <p className="text-muted-foreground mt-2">
        Ratings update automatically after every rated game.
      </p>

      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(profiles ?? []).map((profile, index) => (
            <TableRow key={profile.id}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell>{profile.full_name}</TableCell>
              <TableCell className="text-right font-medium">{profile.rating}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
