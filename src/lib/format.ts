const THAI_MONTHS_ABBR = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatRelativeDate(isoDate: string, today: Date): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const todayStr = toDateOnly(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (isoDate === todayStr) return "วันนี้";
  if (isoDate === toDateOnly(yesterday)) return "เมื่อวาน";

  const day = date.getUTCDate();
  const month = THAI_MONTHS_ABBR[date.getUTCMonth()];
  const buddhistYear = date.getUTCFullYear() + 543;
  return `${day} ${month} ${buddhistYear}`;
}
