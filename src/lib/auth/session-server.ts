import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import type { FamilyMember } from "@/types/database";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET environment variable");
}

export async function createSession(memberId: string, isAdmin: boolean): Promise<void> {
  const token = await createSessionToken(
    { memberId, isAdmin },
    SESSION_SECRET!,
    SESSION_MAX_AGE_SECONDS
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentMember(): Promise<FamilyMember | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token, SESSION_SECRET!);
  if (!payload) return null;

  const { data, error } = await supabaseAdmin
    .from("family_members")
    .select("*")
    .eq("id", payload.memberId)
    .eq("has_setup", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function requireMember(): Promise<FamilyMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireAdmin(): Promise<FamilyMember> {
  const member = await requireMember();
  if (!member.is_admin) redirect("/");
  return member;
}
