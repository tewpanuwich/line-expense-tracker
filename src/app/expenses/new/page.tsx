import { requireMember } from "@/lib/auth/session-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NewExpenseFlow } from "@/app/expenses/new/new-expense-flow";

export default async function NewExpensePage() {
  const member = await requireMember();

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">เพิ่มรายจ่าย</h1>
      <NewExpenseFlow categories={categories ?? []} isAdmin={member.is_admin} />
    </main>
  );
}
