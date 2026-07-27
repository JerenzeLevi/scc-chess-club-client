import Link from "next/link";
import { getAnnouncements } from "@/lib/sheets/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SchedulePage() {
  const announcements = await getAnnouncements();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
      <p className="text-muted-foreground mt-4">
        Announcements and recurring events. Tournament-specific dates and
        registration live on the{" "}
        <Link href="/tournaments" className="underline">
          tournaments page
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {announcements.length ? (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-base">{a.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {a.body}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No announcements posted yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
