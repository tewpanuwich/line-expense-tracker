"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session-server";
import { generateSetupToken } from "@/lib/auth/pin";
import { SETUP_TOKEN_TTL_MS } from "@/lib/auth/constants";

export async function createMember(
  name: string
): Promise<{ error: string } | { setupPath: string }> {
  await requireAdmin();

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "กรุณากรอกชื่อสมาชิก" };
  }

  const setupToken = generateSetupToken();

  const { error } = await supabaseAdmin.from("family_members").insert({
    name: trimmedName,
    setup_token: setupToken,
    setup_token_expires_at: new Date(Date.now() + SETUP_TOKEN_TTL_MS).toISOString(),
    has_setup: false,
    is_admin: false,
  });

  if (error) {
    return { error: "เพิ่มสมาชิกไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/admin");
  return { setupPath: `/setup/${setupToken}` };
}

export async function regenerateSetupLink(
  memberId: string
): Promise<{ error: string } | { setupPath: string }> {
  await requireAdmin();

  const setupToken = generateSetupToken();

  const { error } = await supabaseAdmin
    .from("family_members")
    .update({
      pin_hash: null,
      has_setup: false,
      setup_token: setupToken,
      setup_token_expires_at: new Date(Date.now() + SETUP_TOKEN_TTL_MS).toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    return { error: "สร้างลิงก์ไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/admin");
  return { setupPath: `/setup/${setupToken}` };
}

export async function deleteMember(memberId: string): Promise<{ error: string } | void> {
  const currentAdmin = await requireAdmin();

  if (memberId === currentAdmin.id) {
    return { error: "ลบบัญชีตัวเองไม่ได้" };
  }

  const { error } = await supabaseAdmin.from("family_members").delete().eq("id", memberId);

  if (error) {
    if (error.code === "23503") {
      return { error: "ลบไม่ได้ เนื่องจากสมาชิกคนนี้มีรายการค่าใช้จ่ายที่บันทึกไว้อยู่" };
    }
    return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/admin");
}
