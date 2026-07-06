import Link from "next/link";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { getCategoryColor, getCategoryIcon } from "@/lib/category-style";

type Category = { id: string; name: string; icon: string | null };
type Item = { receipt_id: string; category_id: string | null; amount: number; quantity: number };

export function ReceiptListItem({
  receipt,
  items,
  categoryById,
  today,
}: {
  receipt: {
    id: string;
    merchant_name: string | null;
    purchase_date: string;
    total_amount: number | null;
  };
  items: Item[];
  categoryById: Map<string, Category>;
  today: Date;
}) {
  const total =
    receipt.total_amount ?? items.reduce((s, i) => s + i.amount * i.quantity, 0);
  const primaryCategoryId = items[0]?.category_id ?? null;
  const category = primaryCategoryId ? categoryById.get(primaryCategoryId) : null;
  const Icon = getCategoryIcon(category?.icon ?? null);
  const color = category ? getCategoryColor(category.name, category.id) : "var(--cat-other)";

  return (
    <Link
      href={`/expenses/${receipt.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, white)` }}
      >
        {/* eslint-disable-next-line react-hooks/static-components -- picked from a fixed lucide-react icon map, not created dynamically */}
        <Icon className="h-5 w-5" style={{ color }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{receipt.merchant_name || "ไม่ระบุร้าน"}</p>
        <p className="text-xs text-muted">
          {items.length} รายการ · {formatRelativeDate(receipt.purchase_date, today)}
        </p>
      </div>
      <p className="font-display font-semibold">{formatCurrency(total)}</p>
    </Link>
  );
}
