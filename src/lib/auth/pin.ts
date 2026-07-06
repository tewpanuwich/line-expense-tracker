import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PIN_LENGTH } from "@/lib/auth/constants";

const SALT_ROUNDS = 10;

export function isValidPinFormat(pin: string): boolean {
  const pattern = new RegExp(`^\\d{${PIN_LENGTH}}$`);
  return pattern.test(pin);
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function generateSetupToken(): string {
  return randomBytes(32).toString("base64url");
}
