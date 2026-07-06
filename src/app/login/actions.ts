"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isValidPinFormat, verifyPin } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session-server";

export async function loginWithPin(pin: string): Promise<{ error: string } | void> {
  if (!isValidPinFormat(pin)) {
    return { error: "PIN ไม่ถูกต้อง" };
  }

  const { data: members, error } = await supabaseAdmin
    .from("family_members")
    .select("id, pin_hash, is_admin")
    .eq("has_setup", true);

  if (error) {
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  for (const member of members ?? []) {
    if (member.pin_hash && (await verifyPin(pin, member.pin_hash))) {
      await createSession(member.id, member.is_admin);
      redirect("/");
    }
  }

  return { error: "PIN ไม่ถูกต้อง" };
}
