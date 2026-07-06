"use client";

import { useState, useTransition } from "react";
import { completeSetup } from "@/app/setup/[token]/actions";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { PinKeypad } from "@/components/pin-keypad";

type Stage = "enter" | "confirm";

export function SetupForm({ token }: { token: string }) {
  const [stage, setStage] = useState<Stage>("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pressDigit(digit: string) {
    if (isPending || pin.length >= PIN_LENGTH) return;
    setError(null);

    const nextPin = pin + digit;
    if (nextPin.length < PIN_LENGTH) {
      setPin(nextPin);
      return;
    }

    if (stage === "enter") {
      setFirstPin(nextPin);
      setPin("");
      setStage("confirm");
      return;
    }

    if (nextPin !== firstPin) {
      setError("PIN ยืนยันไม่ตรงกัน");
      setFirstPin("");
      setPin("");
      setStage("enter");
      return;
    }

    setPin(nextPin);
    startTransition(async () => {
      const result = await completeSetup(token, nextPin, nextPin);
      if (result?.error) {
        setError(result.error);
        setFirstPin("");
        setPin("");
        setStage("enter");
      }
    });
  }

  function backspace() {
    if (isPending) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }

  return (
    <div>
      <p className="mb-3 text-center text-sm font-medium text-foreground">
        {stage === "enter" ? "ตั้งรหัส PIN" : "ยืนยันรหัส PIN อีกครั้ง"}
      </p>

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
