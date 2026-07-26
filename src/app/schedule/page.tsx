import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const schedule = [
  {
    title: "Weekly club night",
    when: "Every Wednesday, 6:00–8:00 PM",
    where: "Student Union, Room 204",
    tag: "Casual",
  },
  {
    title: "Ladder session",
    when: "Every other Friday, 5:00 PM",
    where: "Student Union, Room 204",
    tag: "Swiss",
  },
  {
    title: "Fall Open (major event)",
    when: "TBD",
    where: "TBD",
    tag: "Round-robin",
  },
];

export default function SchedulePage() {
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
        {schedule.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">{item.title}</CardTitle>
              <Badge variant="secondary">{item.tag}</Badge>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              <p>{item.when}</p>
              <p>{item.where}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
