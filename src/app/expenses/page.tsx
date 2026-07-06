import Link from "next/link";
import { X } from "lucide-react";
import { requireMember } from "@/lib/auth/session-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ReceiptListItem } from "@/components/receipt-list-item";

export default async function ExpensesListPage() {
  const member = await requireMember();
  const today = new Date();

  const { data: receipts } = await supabaseAdmin
    .from("receipts")
    .select("id, purchase_date, merchant_name, total_amount")
    .eq("member_id", member.id)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  const receiptList = receipts ?? [];
  const receiptIds = receiptList.map((r) => r.id);

  const [{ data: items }, { data: categories }] = await Promise.all([
    receiptIds.length
      ? supabaseAdmin
          .from("expense_items")
          .select("id, receipt_id, category_id, amount, quantity")
          .in("receipt_id", receiptIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from("categories").select("id, name, icon"),
  ]);

  const itemList = items ?? [];
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">รายการรายจ่าย</h1>
        <Link
          href="/"
          aria-label="ย้อนกลับ"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      {receiptList.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted">ยังไม่มีรายจ่ายที่บันทึกไว้</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {receiptList.map((receipt) => (
            <li key={receipt.id}>
              <ReceiptListItem
                receipt={receipt}
                items={itemList.filter((i) => i.receipt_id === receipt.id)}
                categoryById={categoryById}
                today={today}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
