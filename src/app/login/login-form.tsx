"use client";

import { useState, useTransition } from "react";
import { loginWithPin } from "@/app/login/actions";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { PinKeypad } from "@/components/pin-keypad";

export function LoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pressDigit(digit: string) {
    if (isPending || pin.length >= PIN_LENGTH) return;
    setError(null);

    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === PIN_LENGTH) {
      startTransition(async () => {
        const result = await loginWithPin(nextPin);
        if (result?.error) {
          setError(result.error);
          setPin("");
        }
      });
    }
  }

  function backspace() {
    if (isPending) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }

  return (
    <div>
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-muted/40 ${
              i < pin.length ? "border-foreground bg-foreground" : ""
            }`}
          />
        ))}
      </div>

      <p className="mb-4 h-5 text-center text-sm font-medium text-red-600">
        {error ?? ""}
      </p>

      <PinKeypad onDigit={pressDigit} onBackspace={backspace} disabled={isPending} />
    </div>
  );
}
