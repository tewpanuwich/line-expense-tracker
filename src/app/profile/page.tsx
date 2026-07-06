import Link from "next/link";
import { X } from "lucide-react";
import { requireMember } from "@/lib/auth/session-server";
import { getAvatarColor, getInitial } from "@/lib/avatar-color";
import { LineLinkPanel } from "@/app/profile/line-link-panel";

export default async function ProfilePage() {
  const member = await requireMember();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">โปรไฟล์</h1>
        <Link
          href="/"
          aria-label="ย้อนกลับ"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarColor(member.id)}`}
        >
          {getInitial(member.name)}
        </span>
        <div>
          <p className="font-semibold">{member.name}</p>
          <p className="text-xs text-muted">{member.is_admin ? "แอดมิน" : "สมาชิก"}</p>
        </div>
      </div>

      <LineLinkPanel connected={!!member.line_user_id} />
    </main>
  );
}
