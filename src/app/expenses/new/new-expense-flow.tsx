"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, PenLine, Wifi, X } from "lucide-react";
import { ExpenseForm } from "@/app/expenses/new/expense-form";
import { normalizeOcrDate } from "@/lib/ocr/normalize-date";

type Mode = "select" | "manual" | "capture" | "processing" | "review";

type OcrItem = { name: string; price: number; categoryId: string | null };

type OcrResponse = {
  items?: OcrItem[];
  store?: string;
  date?: string | number;
  total?: number;
  message?: string;
  error?: string;
};

type ParsedReceipt = {
  merchantName: string;
  purchaseDate: string | undefined;
  items: { itemName: string; quantity: number; amount: number; categoryId: string | null }[];
};

function toParsedReceipt(data: OcrResponse): ParsedReceipt {
  return {
    merchantName: data.store ?? "",
    purchaseDate: normalizeOcrDate(data.date),
    items: (data.items ?? []).map((item) => ({
      itemName: item.name,
      quantity: 1,
      amount: item.price,
      categoryId: item.categoryId,
    })),
  };
}

export function NewExpenseFlow({
  categories,
  isAdmin,
}: {
  categories: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [mode, setMode] = useState<Mode>("select");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [rawResponse, setRawResponse] = useState<OcrResponse | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setMode("processing");
    setOcrError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", { method: "POST", body: formData });
      const data: OcrResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "OCR failed");
      }

      setRawResponse(data);

      if ((data.items ?? []).length === 0 && data.message) {
        setOcrError(data.message);
        setMode("capture");
        return;
      }

      setParsed(toParsedReceipt(data));
      setMode("review");
    } catch {
      setOcrError("อ่านรูปไม่สำเร็จ กรุณาลองถ่ายใหม่หรือกรอกเอง");
      setMode("capture");
    }
  }

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) handleFile(file);
  }

  if (mode === "select") {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMode("capture")}
          className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">ถ่ายรูปใบเสร็จ</span>
            <span className="block text-sm text-muted">
              ให้ระบบอ่านรายการให้อัตโนมัติ
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PenLine className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">กรอกเอง</span>
            <span className="block text-sm text-muted">พิมพ์รายการด้วยตัวเอง</span>
          </span>
        </button>
      </div>
    );
  }

  if (mode === "manual") {
    return <ExpenseForm categories={categories} source="manual" />;
  }

  if (mode === "capture") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode("select")}
          aria-label="ย้อนกลับ"
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        {ocrError && (
          <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{ocrError}</p>
        )}

        <div className="mb-4 flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-black/15 bg-black/[.02]">
          <div className="text-center text-muted">
            <Camera className="mx-auto mb-2 h-10 w-10" />
            <p className="text-sm">วางใบเสร็จให้อยู่ในกรอบ</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-white shadow-sm"
          >
            <Camera className="h-5 w-5" />
            ถ่ายรูป
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            aria-label="เลือกจากคลังภาพ"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted">
          <Wifi className="h-3 w-3" />
          รูปจะถูกส่งไปประมวลผลข้อความชั่วคราวเท่านั้น ไม่ถูกบันทึกเก็บไว้
        </p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileSelected}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />
      </div>
    );
  }

  if (mode === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="font-medium">กำลังอ่านใบเสร็จ...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
        แยกได้ {parsed?.items.length ?? 0} รายการ — ตรวจสอบ/แก้ไขหมวดหมู่แต่ละชิ้นได้
      </div>

      {isAdmin && (
        <details className="mb-4 rounded-xl bg-black/[.03] p-3 text-xs text-muted">
          <summary className="cursor-pointer font-medium">ดูข้อมูลดิบจาก API (debug)</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">
            {rawResponse ? JSON.stringify(rawResponse, null, 2) : "(ว่างเปล่า)"}
          </pre>
        </details>
      )}

      <ExpenseForm
        categories={categories}
        source="ocr"
        initialMerchantName={parsed?.merchantName ?? ""}
        initialPurchaseDate={parsed?.purchaseDate}
        initialItems={parsed?.items}
      />
    </div>
  );
}
