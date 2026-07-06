"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/session-server";
import type { FamilyMember } from "@/types/database";

async function getReceiptOwner(receiptId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("receipts")
    .select("member_id")
    .eq("id", receiptId)
    .maybeSingle();
  return data?.member_id ?? null;
}

function canAccessReceipt(ownerId: string | null, member: FamilyMember): boolean {
  return ownerId !== null && (ownerId === member.id || member.is_admin);
}

async function recalcReceiptTotal(receiptId: string): Promise<void> {
  const { data: items } = await supabaseAdmin
    .from("expense_items")
    .select("amount, quantity")
    .eq("receipt_id", receiptId);

  const total = (items ?? []).reduce((sum, item) => sum + item.amount * item.quantity, 0);
  await supabaseAdmin.from("receipts").update({ total_amount: total }).eq("id", receiptId);
}

export async function updateExpenseItem(
  itemId: string,
  receiptId: string,
  patch: { itemName: string; quantity: number; amount: number; categoryId: string | null }
): Promise<{ error: string } | void> {
  const member = await requireMember();

  const ownerId = await getReceiptOwner(receiptId);
  if (!canAccessReceipt(ownerId, member)) return { error: "ไม่มีสิทธิ์แก้ไขรายการนี้" };

  if (!patch.itemName.trim()) return { error: "กรุณากรอกชื่อสินค้า" };
  if (!(patch.amount > 0)) return { error: "ราคาต้องมากกว่า 0" };
  if (!(patch.quantity > 0)) return { error: "จำนวนต้องมากกว่า 0" };

  const { error } = await supabaseAdmin
    .from("expense_items")
    .update({
      item_name: patch.itemName.trim(),
      quantity: patch.quantity,
      amount: patch.amount,
      category_id: patch.categoryId,
    })
    .eq("id", itemId)
    .eq("receipt_id", receiptId);

  if (error) return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };

  await recalcReceiptTotal(receiptId);
  revalidatePath(`/expenses/${receiptId}`);
  revalidatePath("/");
}

export async function deleteExpenseItem(
  itemId: string,
  receiptId: string
): Promise<{ error: string } | void> {
  const member = await requireMember();

  const ownerId = await getReceiptOwner(receiptId);
  if (!canAccessReceipt(ownerId, member)) return { error: "ไม่มีสิทธิ์ลบรายการนี้" };

  const { error } = await supabaseAdmin
    .from("expense_items")
    .delete()
    .eq("id", itemId)
    .eq("receipt_id", receiptId);
  if (error) return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };

  await recalcReceiptTotal(receiptId);
  revalidatePath(`/expenses/${receiptId}`);
  revalidatePath("/");
}

export async function deleteReceipt(receiptId: string): Promise<{ error: string } | void> {
  const member = await requireMember();

  const ownerId = await getReceiptOwner(receiptId);
  if (!canAccessReceipt(ownerId, member)) return { error: "ไม่มีสิทธิ์ลบใบเสร็จนี้" };

  const { error } = await supabaseAdmin.from("receipts").delete().eq("id", receiptId);
  if (error) return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };

  revalidatePath("/");
  redirect("/");
}
