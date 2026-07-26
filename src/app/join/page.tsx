import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JoinPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Join the club
      </h1>
      <p className="text-muted-foreground mt-4">
        Membership is free and open to all students. Create an account to
        register for tournaments, appear on the club ladder, and play casual
        games with other members.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Ready to sign up?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Create an account with your student email, then show up to a
            weekly club night — no experience required.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/signup">Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/schedule">See when we meet</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground mt-8 text-sm">
        <p>Questions? Reach out to the club officers on the about page.</p>
      </div>
    </div>
  );
}
