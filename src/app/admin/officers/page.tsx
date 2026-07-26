import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addOfficer, updateOfficer, removeOfficer } from "@/app/actions/officers";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminOfficersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: officers } = await supabase
    .from("officers")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Officers</h1>
          <p className="text-muted-foreground mt-2">
            Edit the officer roster shown on the about page — name, 1:1
            photo, or add/remove positions entirely.
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

      <div className="mt-8 flex flex-col gap-4">
        {officers?.map((officer) => (
          <Card key={officer.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {officer.role}
                {officer.name ? ` — ${officer.name}` : ""}
              </CardTitle>
            </CardHeader>
            <form
              action={updateOfficer.bind(null, officer.id)}
              encType="multipart/form-data"
            >
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="size-16 shrink-0">
                  <AvatarImage src={officer.photo_url ?? undefined} alt="" />
                  <AvatarFallback>
                    {officer.role.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`role-${officer.id}`}>Role</Label>
                    <Input
                      id={`role-${officer.id}`}
                      name="role"
                      defaultValue={officer.role}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`name-${officer.id}`}>Name</Label>
                    <Input
                      id={`name-${officer.id}`}
                      name="name"
                      defaultValue={officer.name ?? ""}
                      placeholder="TBD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`photo-${officer.id}`}>
                      Photo (1:1)
                    </Label>
                    <Input
                      id={`photo-${officer.id}`}
                      name="photo"
                      type="file"
                      accept="image/*"
                    />
                  </div>
                </div>
              </CardContent>
              <CardContent className="flex justify-end gap-2 pt-0">
                <Button type="submit" size="sm">
                  Save
                </Button>
              </CardContent>
            </form>
            <form action={removeOfficer.bind(null, officer.id)}>
              <CardContent className="flex justify-end pt-0">
                <Button type="submit" size="sm" variant="destructive">
                  Remove position
                </Button>
              </CardContent>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Add position</CardTitle>
          <CardDescription>
            Create a new officer container — e.g. a role not yet on the
            roster.
          </CardDescription>
        </CardHeader>
        <form action={addOfficer}>
          <CardContent className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newRole">Role name</Label>
              <Input
                id="newRole"
                name="role"
                placeholder="e.g. Events Coordinator"
                required
              />
            </div>
            <Button type="submit">Add</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
