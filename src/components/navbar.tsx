import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/schedule", label: "Schedule" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/ladder", label: "Ladder" },
  { href: "/play", label: "Play" },
];

export async function Navbar() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.jpg"
            alt="SCC Chess Club logo"
            width={32}
            height={32}
            className="rounded-sm"
          />
          <span>SCC Chess Club</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin">Admin</Link>
              </Button>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Admin sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
