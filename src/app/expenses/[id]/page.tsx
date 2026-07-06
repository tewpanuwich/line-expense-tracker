import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth/session-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ExpenseDetail } from "@/app/expenses/[id]/expense-detail";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await requireMember();
  const { id } = await params;

  const { data: receipt } = await supabaseAdmin
    .from("receipts")
    .select("id, merchant_name, purchase_date, total_amount, source, member_id")
    .eq("id", id)
    .maybeSingle();

  if (!receipt) notFound();
  if (receipt.member_id !== member.id && !member.is_admin) notFound();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from("expense_items")
      .select("id, category_id, item_name, amount, quantity")
      .eq("receipt_id", id)
      .order("created_at"),
    supabaseAdmin.from("categories").select("id, name").order("name"),
  ]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <ExpenseDetail receipt={receipt} items={items ?? []} categories={categories ?? []} />
    </main>
  );
}
