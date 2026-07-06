import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { requireMember } from "@/lib/auth/session-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { getCategoryColor } from "@/lib/category-style";
import { getAvatarColor, getInitial } from "@/lib/avatar-color";
import { CategoryChart } from "@/app/category-chart";
import { ReceiptListItem } from "@/components/receipt-list-item";

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lineTotal(item: { amount: number; quantity: number }): number {
  return item.amount * item.quantity;
}

export default async function Home() {
  const member = await requireMember();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setUTCDate(today.getUTCDate() - daysSinceMonday);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(thisWeekStart.getUTCDate() - 7);
  const lastWeekComparableEnd = new Date(lastWeekStart);
  lastWeekComparableEnd.setUTCDate(lastWeekStart.getUTCDate() + daysSinceMonday);

  const thisMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const fetchStart = new Date(
    Math.min(thisMonthStart.getTime(), lastWeekStart.getTime())
  );

  const [{ data: categories }, { data: receipts }] = await Promise.all([
    supabaseAdmin.from("categories").select("id, name, icon").order("name"),
    supabaseAdmin
      .from("receipts")
      .select("id, purchase_date, merchant_name, total_amount, source, member_id, created_at")
      .eq("member_id", member.id)
      .gte("purchase_date", dateOnly(fetchStart))
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const receiptList = receipts ?? [];
  const receiptIds = receiptList.map((r) => r.id);

  const { data: items } = receiptIds.length
    ? await supabaseAdmin
        .from("expense_items")
        .select("id, receipt_id, category_id, amount, quantity")
        .in("receipt_id", receiptIds)
    : { data: [] };

  const itemList = items ?? [];
  const categoryList = categories ?? [];
  const categoryById = new Map(categoryList.map((c) => [c.id, c]));
  const receiptById = new Map(receiptList.map((r) => [r.id, r]));

  function sumInRange(startIso: string, endIso: string): number {
    return itemList.reduce((sum, item) => {
      const receipt = receiptById.get(item.receipt_id);
      if (!receipt) return sum;
      if (receipt.purchase_date >= startIso && receipt.purchase_date <= endIso) {
        return sum + lineTotal(item);
      }
      return sum;
    }, 0);
  }

  function categoryTotalsInRange(startIso: string, endIso: string) {
    const totals = new Map<string, number>();
    for (const item of itemList) {
      const receipt = receiptById.get(item.receipt_id);
      if (!receipt) continue;
      if (receipt.purchase_date < startIso || receipt.purchase_date > endIso) continue;
      const key = item.category_id ?? "uncategorized";
      totals.set(key, (totals.get(key) ?? 0) + lineTotal(item));
    }
    return totals;
  }

  const todayIso = dateOnly(today);
  const thisWeekTotal = sumInRange(dateOnly(thisWeekStart), todayIso);
  const lastWeekTotal = sumInRange(dateOnly(lastWeekStart), dateOnly(lastWeekComparableEnd));
  const monthTotals = categoryTotalsInRange(dateOnly(thisMonthStart), todayIso);
  const weekTotalsByCategory = categoryTotalsInRange(dateOnly(thisWeekStart), todayIso);

  const monthReceiptCount = receiptList.filter(
    (r) => r.purchase_date >= dateOnly(thisMonthStart) && r.purchase_date <= todayIso
  ).length;

  let topCategoryName: string | null = null;
  let topCategoryAmount = 0;
  for (const [categoryId, amount] of monthTotals) {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      topCategoryName = categoryById.get(categoryId)?.name ?? "ไม่มีหมวดหมู่";
    }
  }

  const trendPercent =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : thisWeekTotal > 0
        ? 100
        : 0;

  function toChartData(totals: Map<string, number>) {
    return categoryList
      .map((category) => ({
        name: category.name,
        value: totals.get(category.id) ?? 0,
        color: getCategoryColor(category.name, category.id),
      }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  const weekChartData = toChartData(weekTotalsByCategory);
  const monthChartData = toChartData(monthTotals);

  const recentReceipts = receiptList.slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">สวัสดี 👋</p>
          <h1 className="text-2xl font-bold">{member.name}</h1>
        </div>
        <Link
          href="/profile"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(member.id)}`}
        >
          {getInitial(member.name)}
        </Link>
      </div>

      <div className="mb-4 rounded-2xl bg-primary p-5 text-white shadow-sm">
        <p className="text-sm text-white/80">รายจ่ายสัปดาห์นี้</p>
        <p className="font-display text-4xl font-bold">{formatCurrency(thisWeekTotal)}</p>
        {lastWeekTotal > 0 && (
          <p className="mt-2 flex items-center gap-1 text-sm text-white/90">
            {trendPercent >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {trendPercent >= 0 ? "มากกว่า" : "น้อยกว่า"}สัปดาห์ก่อน {Math.abs(trendPercent)}%
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted">ใบเสร็จเดือนนี้</p>
          <p className="font-display text-2xl font-bold">{monthReceiptCount}</p>
          <p className="text-xs text-muted">ใบ</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted">จ่ายเยอะสุด</p>
          {topCategoryName ? (
            <>
              <p className="truncate font-semibold">{topCategoryName}</p>
              <p className="font-display text-sm text-muted">
                {formatCurrency(topCategoryAmount)}
              </p>
            </>
          ) : (
            <p className="font-semibold text-muted">ยังไม่มี</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <CategoryChart weekData={weekChartData} monthData={monthChartData} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">ใบเสร็จล่าสุด</h2>
        <Link href="/expenses" className="text-sm font-medium text-primary">
          ดูทั้งหมด
        </Link>
      </div>

      {recentReceipts.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted">ยังไม่มีรายจ่ายที่บันทึกไว้</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recentReceipts.map((receipt) => (
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
