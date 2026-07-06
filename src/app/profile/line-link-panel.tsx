import { CheckCircle2, MessageCircle } from "lucide-react";

export function LineLinkPanel({ connected }: { connected: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-5 w-5" />
        </span>
        <h2 className="font-semibold">บัญชี LINE</h2>
      </div>

      {connected ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          เชื่อมต่อ LINE แล้ว — ส่งรูปใบเสร็จผ่านแชทได้เลย
        </div>
      ) : (
        <p className="text-sm text-muted">
          ยังไม่ได้เชื่อมต่อ LINE — เพิ่มบอทเป็นเพื่อนแล้วพิมพ์ &quot;สร้างบัญชี&quot; ในแชทเพื่อสมัครสมาชิก
        </p>
      )}
    </div>
  );
}
