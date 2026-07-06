"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/session-server";
import { createExpenseForMember } from "@/lib/expenses/create-expense";
import type { CreateExpenseInput } from "@/lib/expenses/create-expense";

export type { ExpenseItemInput, CreateExpenseInput } from "@/lib/expenses/create-expense";

export async function createExpense(
  input: CreateExpenseInput
): Promise<{ error: string } | void> {
  const member = await requireMember();

  const result = await createExpenseForMember(member.id, input);
  if ("error" in result) {
    return { error: result.error };
  }

  redirect("/");
}
