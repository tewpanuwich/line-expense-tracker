import { supabaseAdmin } from "@/lib/supabase/server";
import type { ExpenseSource } from "@/types/database";

export type ExpenseItemInput = {
  categoryId: string | null;
  itemName: string;
  amount: number;
  quantity: number;
};

export type CreateExpenseInput = {
  merchantName: string;
  purchaseDate: string;
  totalAmount: number | null;
  source: ExpenseSource;
  items: ExpenseItemInput[];
};

export async function createExpenseForMember(
  memberId: string,
  input: CreateExpenseInput
): Promise<{ error: string } | { receiptId: string }> {
  if (input.items.length === 0) {
    return { error: "กรุณาเพิ่มอย่างน้อย 1 รายการ" };
  }
  for (const item of input.items) {
    if (!item.itemName.trim()) return { error: "กรุณากรอกชื่อสินค้าให้ครบทุกแถว" };
    if (!(item.amount > 0)) return { error: "ราคาต้องมากกว่า 0" };
    if (!(item.quantity > 0)) return { error: "จำนวนต้องมากกว่า 0" };
  }
  if (!input.purchaseDate) {
    return { error: "กรุณาเลือกวันที่" };
  }

  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from("receipts")
    .insert({
      member_id: memberId,
      merchant_name: input.merchantName.trim() || null,
      purchase_date: input.purchaseDate,
      total_amount: input.totalAmount,
      source: input.source,
    })
    .select("id")
    .single();

  if (receiptError || !receipt) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  const { error: itemsError } = await supabaseAdmin.from("expense_items").insert(
    input.items.map((item) => ({
      receipt_id: receipt.id,
      category_id: item.categoryId,
      item_name: item.itemName.trim(),
      amount: item.amount,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    await supabaseAdmin.from("receipts").delete().eq("id", receipt.id);
    return { error: "บันทึกรายการไม่สำเร็จ กรุณาลองใหม่" };
  }

  return { receiptId: receipt.id };
}
