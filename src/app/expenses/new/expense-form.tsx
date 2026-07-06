"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createExpense, type ExpenseItemInput } from "@/app/expenses/new/actions";
import { formatCurrency } from "@/lib/format";
import type { ExpenseSource } from "@/types/database";

type Row = ExpenseItemInput & { id: string };

function newRow(): Row {
  return { id: crypto.randomUUID(), itemName: "", quantity: 1, amount: 0, categoryId: null };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  categories,
  source,
  initialMerchantName = "",
  initialPurchaseDate,
  initialItems,
}: {
  categories: { id: string; name: string }[];
  source: ExpenseSource;
  initialMerchantName?: string;
  initialPurchaseDate?: string | null;
  initialItems?: {
    itemName: string;
    quantity: number;
    amount: number;
    categoryId?: string | null;
  }[];
}) {
  const [merchantName, setMerchantName] = useState(initialMerchantName);
  const [purchaseDate, setPurchaseDate] = useState(initialPurchaseDate || todayIso());
  const [rows, setRows] = useState<Row[]>(() =>
    initialItems && initialItems.length > 0
      ? initialItems.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          categoryId: item.categoryId ?? null,
        }))
      : [newRow()]
  );
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemsSum = rows.reduce((sum, row) => sum + row.amount * row.quantity, 0);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function applyCategoryToAll(categoryId: string) {
    setBulkCategoryId(categoryId);
    setRows((prev) => prev.map((row) => ({ ...row, categoryId: categoryId || null })));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await createExpense({
        merchantName,
        purchaseDate,
        totalAmount: itemsSum,
        source,
        items: rows.map((row) => ({
          categoryId: row.categoryId,
          itemName: row.itemName,
          amount: row.amount,
          quantity: row.quantity,
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">หัวใบเสร็จ</h2>
        <label className="mb-1 block text-xs text-muted" htmlFor="merchant-name">
          ชื่อร้าน
        </label>
        <input
          id="merchant-name"
          type="text"
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value)}
          placeholder="ชื่อร้าน (ไม่บังคับ)"
          className="mb-3 w-full rounded-xl bg-black/[.03] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <label className="mb-1 block text-xs text-muted" htmlFor="purchase-date">
          วันที่
        </label>
        <input
          id="purchase-date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full rounded-xl bg-black/[.03] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">รายการสินค้า ({rows.length})</h2>
          {source === "ocr" && (
            <span className="text-xs text-muted">OCR แยกให้อัตโนมัติ · แก้ไขได้</span>
          )}
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-[10px] text-muted">ใช้หมวดหมู่เดียวกันทั้งหมด</label>
          <select
            value={bulkCategoryId}
            onChange={(e) => applyCategoryToAll(e.target.value)}
            className="w-full rounded-lg bg-black/[.03] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">เลือกหมวดหมู่เพื่อใช้กับทุกรายการ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl bg-black/[.02] p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  value={row.itemName}
                  onChange={(e) => updateRow(row.id, { itemName: e.target.value })}
                  placeholder="ชื่อสินค้า"
                  className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label="ลบรายการ"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] text-muted">จำนวน</label>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })}
                    className="w-full rounded-lg bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted">ราคา (฿)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) })}
                    className="w-full rounded-lg bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted">หมวดหมู่</label>
                  <select
                    value={row.categoryId ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { categoryId: e.target.value || null })
                    }
                    className="w-full rounded-lg bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">ไม่ระบุ</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-black/15 py-2 text-sm text-muted"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายการ
        </button>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">ผลรวมรายการ</span>
          <span className="font-display font-semibold">{formatCurrency(itemsSum)}</span>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-2xl bg-primary py-3 font-semibold text-white shadow-sm disabled:opacity-50"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึกใบเสร็จ"}
      </button>
    </div>
  );
}
