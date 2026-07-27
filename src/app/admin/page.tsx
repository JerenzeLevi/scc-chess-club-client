import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getEvents } from "@/lib/sheets/data";
import { createEvent } from "@/app/actions/tournaments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { error } = await searchParams;
  const events = await getEvents();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-muted-foreground mt-2">
            Create events and manage tournaments.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/announcements">
            <Button variant="outline">Announcements</Button>
          </Link>
          <Link href="/admin/officers">
            <Button variant="outline">Manage officers</Button>
          </Link>
          {profile.role === "superadmin" && (
            <Link href="/admin/admins">
              <Button variant="outline">Manage admins</Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>New event</CardTitle>
          <CardDescription>
            Weekly sessions use Swiss; major school tournaments can use
            round-robin.
          </CardDescription>
        </CardHeader>
        <form action={createEvent}>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Event name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date</Label>
              <Input id="eventDate" name="eventDate" type="date" required />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="format">Format</Label>
              <Select name="format" defaultValue="swiss">
                <SelectTrigger id="format" className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swiss">Swiss</SelectItem>
                  <SelectItem value="round_robin">Round-robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button type="submit">Create event</Button>
          </CardContent>
        </form>
      </Card>

      <h2 className="mt-12 text-xl font-semibold">Events</h2>
      <div className="mt-4 flex flex-col gap-3">
        {events.length ? (
          events.map((event) => (
            <Link key={event.id} href={`/admin/events/${event.id}`}>
              <Card className="hover:border-foreground/30 transition-colors">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <CardDescription>{event.eventDate}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {event.format === "swiss" ? "Swiss" : "Round-robin"}
                    </Badge>
                    <Badge
                      variant={
                        event.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No events yet.</p>
        )}
      </div>
    </div>
  );
}
