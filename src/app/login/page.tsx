import Link from "next/link";
import { signIn, resendConfirmation } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    unconfirmedEmail?: string;
    resent?: string;
  }>;
}) {
  const { error, unconfirmedEmail, resent } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Welcome back to the SCC Chess Club.
          </CardDescription>
        </CardHeader>
        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {unconfirmedEmail && (
              <form action={resendConfirmation} className="mt-2">
                <input type="hidden" name="email" value={unconfirmedEmail} />
                <button type="submit" className="text-foreground text-sm underline">
                  Resend confirmation email
                </button>
              </form>
            )}
          </CardContent>
        )}
        <form action={signIn}>
          <CardContent className="space-y-4">
            {resent && (
              <Alert>
                <AlertDescription>
                  Confirmation email sent. Check your inbox.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-muted-foreground text-sm">
              No account?{" "}
              <Link href="/signup" className="text-foreground underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
