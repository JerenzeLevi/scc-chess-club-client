import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnnouncements } from "@/lib/sheets/data";

const features = [
  {
    title: "Swiss & round-robin tournaments",
    description:
      "Run weekly Swiss sessions or full round-robin events for major school tournaments, with pairings generated automatically.",
    href: "/tournaments",
    cta: "View tournaments",
  },
  {
    title: "Club ladder",
    description:
      "Every rated result updates the club ladder, so you always know where you stand.",
    href: "/ladder",
    cta: "See the ladder",
  },
  {
    title: "Free-time play",
    description:
      "Play a casual game on one board, or share a room code to play a friend online — just for fun, not rated.",
    href: "/play",
    cta: "Play now",
  },
];

export default async function Home() {
  const announcements = (await getAnnouncements()).slice(0, 3);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-border border-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <Image
            src="/logo.jpg"
            alt="SCC Chess Club logo"
            width={96}
            height={96}
            className="rounded-md"
            priority
          />
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            SCC Chess Club
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Tournaments, a club ladder, and casual games for every player on
            campus — from first-timers to tournament regulars.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/about">About the club</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/schedule">See the schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold">Announcements</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {a.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.href}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
              <Button asChild variant="secondary" className="w-fit">
                <Link href={feature.href}>{feature.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
