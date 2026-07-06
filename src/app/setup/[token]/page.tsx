import { Link as LinkIcon } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isSetupTokenValid } from "@/lib/auth/setup-token";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { getAvatarColor, getInitial } from "@/lib/avatar-color";
import { SetupForm } from "@/app/setup/[token]/setup-form";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: member } = await supabaseAdmin
    .from("family_members")
    .select("id, name, has_setup, setup_token_expires_at")
    .eq("setup_token", token)
    .maybeSingle();

  if (!isSetupTokenValid(member)) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <h1 className="mb-2 text-xl font-bold">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h1>
        <p className="text-sm text-muted">
          กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิงก์ตั้งค่าใหม่
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LinkIcon className="h-3 w-3" />
            ลิงก์ตั้งค่าครั้งเดียว
          </span>
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold">
          ตั้งรหัส PIN ของคุณ
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          สร้างรหัส {PIN_LENGTH} หลักไว้เข้าใช้งานครั้งต่อไป
        </p>

        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(member.id)}`}
          >
            {getInitial(member.name)}
          </span>
          <div>
            <p className="text-xs text-muted">ชื่อนี้แก้ไม่ได้ที่นี่</p>
            <p className="font-semibold">{member.name}</p>
          </div>
        </div>

        <SetupForm token={token} />
      </div>
    </main>
  );
}
