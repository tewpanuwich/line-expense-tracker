"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPin, isValidPinFormat } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session-server";
import { isSetupTokenValid } from "@/lib/auth/setup-token";

export async function completeSetup(
  token: string,
  pin: string,
  confirmPin: string
): Promise<{ error: string } | void> {
  if (!isValidPinFormat(pin)) {
    return { error: "PIN ต้องเป็นตัวเลข 4-6 หลัก" };
  }
  if (pin !== confirmPin) {
    return { error: "PIN ยืนยันไม่ตรงกัน" };
  }

  const { data: member, error: fetchError } = await supabaseAdmin
    .from("family_members")
    .select("id, has_setup, setup_token_expires_at")
    .eq("setup_token", token)
    .maybeSingle();

  if (fetchError || !isSetupTokenValid(member)) {
    return { error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" };
  }

  const pinHash = await hashPin(pin);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("family_members")
    .update({
      pin_hash: pinHash,
      has_setup: true,
      setup_token: null,
      setup_token_expires_at: null,
    })
    .eq("id", member.id)
    .select("id, is_admin")
    .single();

  if (updateError || !updated) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  await createSession(updated.id, updated.is_admin);
  redirect("/");
}
