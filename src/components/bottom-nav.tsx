import Link from "next/link";
import { Home, List, Plus, Users, LogOut } from "lucide-react";
import { logout } from "@/lib/auth/actions";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/5 bg-card px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted"
        >
          <Home className="h-5 w-5" />
          หน้าหลัก
        </Link>
        <Link
          href="/expenses"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted"
        >
          <List className="h-5 w-5" />
          รายการ
        </Link>
        <Link
          href="/expenses/new"
          aria-label="เพิ่มรายจ่าย"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted"
          >
            <Users className="h-5 w-5" />
            สมาชิก
          </Link>
        ) : (
          <span className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-transparent">
            <Users className="h-5 w-5" />
            .
          </span>
        )}
        <form action={logout} className="contents">
          <button
            type="submit"
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted"
          >
            <LogOut className="h-5 w-5" />
            ออก
          </button>
        </form>
      </div>
    </nav>
  );
}
