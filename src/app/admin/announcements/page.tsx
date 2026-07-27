import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getAnnouncements } from "@/lib/sheets/data";
import { addAnnouncement, removeAnnouncement } from "@/app/actions/admin-manage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { error } = await searchParams;
  const announcements = await getAnnouncements();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-2">
            Posted announcements show on the home page.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to admin</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
        </CardHeader>
        <form action={addAnnouncement}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Input id="body" name="body" />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button type="submit">Post</Button>
          </CardContent>
        </form>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{a.title}</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">{a.body}</p>
              </div>
              <form action={removeAnnouncement.bind(null, a.id)}>
                <Button type="submit" size="sm" variant="ghost">
                  Remove
                </Button>
              </form>
            </CardHeader>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-muted-foreground text-sm">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
