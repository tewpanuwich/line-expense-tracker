import { requireAdmin } from "@/lib/auth/session-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isTokenExpired } from "@/lib/auth/setup-token";
import { MemberList } from "@/app/admin/member-list";

export default async function AdminPage() {
  const currentAdmin = await requireAdmin();

  const { data: members } = await supabaseAdmin
    .from("family_members")
    .select("id, name, is_admin, has_setup, setup_token_expires_at")
    .order("created_at", { ascending: true });

  const memberList = (members ?? []).map((member) => ({
    id: member.id,
    name: member.name,
    is_admin: member.is_admin,
    has_setup: member.has_setup,
    isExpired: isTokenExpired(member.setup_token_expires_at),
  }));

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">จัดการสมาชิก</h1>
      <p className="mb-6 text-sm text-muted">
        เพิ่ม ลบ และสร้างลิงก์ตั้งค่า PIN
      </p>

      <MemberList members={memberList} currentAdminId={currentAdmin.id} />
    </main>
  );
}
