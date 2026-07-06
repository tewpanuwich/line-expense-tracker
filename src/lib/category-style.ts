import {
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
};

export function getCategoryIcon(iconName: string | null): LucideIcon {
  return (iconName && ICON_MAP[iconName]) || MoreHorizontal;
}

const COLOR_BY_NAME: Record<string, string> = {
  อาหาร: "var(--cat-food)",
  เดินทาง: "var(--cat-transport)",
  ของใช้ในบ้าน: "var(--cat-household)",
  บันเทิง: "var(--cat-entertainment)",
  สุขภาพ: "var(--cat-health)",
  การศึกษา: "var(--cat-education)",
  ช้อปปิ้ง: "var(--cat-shopping)",
  อื่นๆ: "var(--cat-other)",
};

const FALLBACK_PALETTE = [
  "var(--cat-food)",
  "var(--cat-transport)",
  "var(--cat-household)",
  "var(--cat-entertainment)",
  "var(--cat-health)",
  "var(--cat-education)",
  "var(--cat-shopping)",
  "var(--cat-other)",
];

export function getCategoryColor(name: string, seed: string): string {
  if (COLOR_BY_NAME[name]) return COLOR_BY_NAME[name];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}
