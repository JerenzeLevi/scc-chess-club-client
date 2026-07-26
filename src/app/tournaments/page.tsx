import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Tournaments</h1>
      <p className="text-muted-foreground mt-2">
        Weekly Swiss sessions and major round-robin events.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {events?.length ? (
          events.map((event) => (
            <Link key={event.id} href={`/tournaments/${event.id}`}>
              <Card className="hover:border-foreground/30 transition-colors">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <CardDescription>{event.event_date}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {event.format === "swiss" ? "Swiss" : "Round-robin"}
                    </Badge>
                    <Badge variant={event.status === "completed" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No tournaments scheduled yet.</p>
        )}
      </div>
    </div>
  );
}
