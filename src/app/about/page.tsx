import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: officers } = await supabase
    .from("officers")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About the club</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl">
        The SCC Chess Club is open to all students, from complete beginners to
        tournament regulars. We meet weekly for casual play, run Swiss-format
        ladder sessions, and host round-robin tournaments for major school
        events.
      </p>

      <h2 className="mt-12 text-xl font-semibold">Officers</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {officers?.map((officer) => (
          <Card key={officer.id}>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <Avatar className="size-12">
                <AvatarImage src={officer.photo_url ?? undefined} alt="" />
                <AvatarFallback>
                  {officer.role.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-base">{officer.role}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {officer.name ?? "TBD"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
