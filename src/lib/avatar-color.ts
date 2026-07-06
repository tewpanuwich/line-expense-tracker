const AVATAR_COLORS = [
  "bg-orange-700",
  "bg-blue-700",
  "bg-emerald-700",
  "bg-purple-600",
  "bg-pink-700",
  "bg-amber-700",
];

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitial(name: string): string {
  return name.trim().charAt(0) || "?";
}
