"use client";

import { Delete } from "lucide-react";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          className="aspect-square rounded-2xl bg-card font-display text-2xl font-semibold text-foreground shadow-sm active:bg-black/5 disabled:opacity-50"
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label="ลบ"
        className="flex aspect-square items-center justify-center rounded-2xl bg-card text-foreground shadow-sm active:bg-black/5 disabled:opacity-50"
      >
        <Delete className="h-6 w-6" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit("0")}
        className="aspect-square rounded-2xl bg-card font-display text-2xl font-semibold text-foreground shadow-sm active:bg-black/5 disabled:opacity-50"
      >
        0
      </button>
      <div aria-hidden="true" />
    </div>
  );
}
