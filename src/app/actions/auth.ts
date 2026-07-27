"use server";

import { signIn as authSignIn, signOut as authSignOut } from "@/lib/auth";

export async function signInWithGoogle() {
  await authSignIn("google", { redirectTo: "/" });
}

export async function signOut() {
  await authSignOut({ redirectTo: "/" });
}
