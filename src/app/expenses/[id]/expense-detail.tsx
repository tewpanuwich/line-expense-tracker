"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Camera, PenLine, Trash2, X } from "lucide-react";
import {
  deleteExpenseItem,
  deleteReceipt,
  updateExpenseItem,
} from "@/app/expenses/[id]/actions";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import type { ExpenseSource } from "@/types/database";

type Item = {
  id: string;
  category_id: string | null;
  item_name: string;
  amount: number;
  quantity: number;
};

type Receipt = {
  id: string;
  merchant_name: string | null;
  purchase_date: string;
  total_amount: number | null;
  source: ExpenseSource;
};

function ItemRow({
  item,
  receiptId,
  categories,
}: {
  item: Item;
  receiptId: string;
  categories: { id: string; name: string }[];
}) {
  const [itemName, setItemName] = useState(item.item_name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [amount, setAmount] = useState(item.amount);
  const [categoryId, setCategoryId] = useState(item.category_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    itemName !== item.item_name ||
    quantity !== item.quantity ||
    amount !== item.amount ||
    categoryId !== (item.category_id ?? "");

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateExpenseItem(item.id, receiptId, {
        itemName,
        quantity,
        amount,
        categoryId: categoryId || null,
      });
      if (result?.error) setError(result.error);
    });
  }

  function handleDelete() {
    if (!window.confirm(`ลบ "${item.item_name}" ออกจากใบเสร็จนี้ใช่ไหม?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteExpenseItem(item.id, receiptId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-xl bg-black/[.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="ชื่อสินค้า"
          className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="ลบรายการ"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 disabled:opacity-50"
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
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-lg bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted">ราคา (฿)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted">หมวดหมู่</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      {dirty && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
      )}
    </div>
  );
}

export function ExpenseDetail({
  receipt,
  items,
  categories,
}: {
  receipt: Receipt;
  items: Item[];
  categories: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = receipt.total_amount ?? items.reduce((s, i) => s + i.amount * i.quantity, 0);

  function handleDeleteReceipt() {
    if (!window.confirm("ลบใบเสร็จนี้ทั้งใบใช่ไหม? การลบนี้ย้อนกลับไม่ได้")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReceipt(receipt.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="ย้อนกลับ"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <X className="h-4 w-4" />
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {receipt.source === "ocr" ? (
            <Camera className="h-3 w-3" />
          ) : (
            <PenLine className="h-3 w-3" />
          )}
          {receipt.source === "ocr" ? "จาก OCR" : "กรอกเอง"}
        </span>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-lg font-bold">{receipt.merchant_name || "ไม่ระบุร้าน"}</p>
        <p className="text-sm text-muted">
          {formatRelativeDate(receipt.purchase_date, new Date())}
        </p>
        <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(total)}</p>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">รายการสินค้า ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">ไม่มีรายการสินค้า</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                receiptId={receipt.id}
                categories={categories}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleDeleteReceipt}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 font-semibold text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        ลบใบเสร็จนี้
      </button>
    </div>
  );
}
