import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/session-server";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const member = await getCurrentMember();
  if (member) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">
        <h1 className="mb-1 text-center text-2xl font-bold">เข้าสู่ระบบ</h1>
        <p className="mb-8 text-center text-sm text-muted">
          กรอกรหัส PIN ของคุณ
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
