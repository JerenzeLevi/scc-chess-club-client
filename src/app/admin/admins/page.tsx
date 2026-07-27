import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getAdmins } from "@/lib/sheets/data";
import { addAdmin, removeAdmin } from "@/app/actions/admin-manage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export default async function AdminAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "superadmin") redirect("/admin");

  const { error } = await searchParams;
  const admins = await getAdmins();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admins</h1>
          <p className="text-muted-foreground mt-2">
            Add or remove club admins by institutional email.
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
          <CardTitle>Add admin</CardTitle>
        </CardHeader>
        <form action={addAdmin}>
          <CardContent className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Institutional email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="admin">
                <SelectTrigger id="role" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Add</Button>
          </CardContent>
        </form>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        {admins.map((a) => (
          <Card key={a.email}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <span className="text-sm">{a.email}</span>
                <Badge variant={a.role === "superadmin" ? "default" : "secondary"}>
                  {a.role}
                </Badge>
              </div>
              {a.email !== profile.email && (
                <form action={removeAdmin.bind(null, a.email)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
