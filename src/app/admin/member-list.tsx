"use client";

import { useState, useTransition } from "react";
import { Link as LinkIcon, Trash2, Check } from "lucide-react";
import { createMember, deleteMember, regenerateSetupLink } from "@/app/admin/actions";
import { getAvatarColor, getInitial } from "@/lib/avatar-color";

type Member = {
  id: string;
  name: string;
  is_admin: boolean;
  has_setup: boolean;
  isExpired: boolean;
};

async function copyToClipboard(path: string): Promise<boolean> {
  const url = `${window.location.origin}${path}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function MemberList({
  members,
  currentAdminId,
}: {
  members: Member[];
  currentAdminId: string;
}) {
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<{ id: string; url: string } | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function finishLink(id: string, path: string) {
    const url = `${window.location.origin}${path}`;
    const copied = await copyToClipboard(path);
    if (copied) {
      setCopiedId(id);
      setPendingLink(null);
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      setPendingLink({ id, url });
    }
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createMember(name);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setName("");
      await finishLink("new", result.setupPath);
    });
  }

  function handleResetLink(memberId: string) {
    setRowError(null);
    startTransition(async () => {
      const result = await regenerateSetupLink(memberId);
      if ("error" in result) {
        setRowError({ id: memberId, message: result.error });
        return;
      }
      await finishLink(memberId, result.setupPath);
    });
  }

  function handleDelete(memberId: string, memberName: string) {
    if (!window.confirm(`ลบ "${memberName}" ออกจากครอบครัวใช่ไหม?`)) return;
    setRowError(null);
    startTransition(async () => {
      const result = await deleteMember(memberId);
      if (result?.error) {
        setRowError({ id: memberId, message: result.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-card p-4 shadow-sm"
      >
        <label htmlFor="member-name" className="mb-1 block text-sm font-medium">
          เพิ่มสมาชิกใหม่
        </label>
        <div className="flex gap-2">
          <input
            id="member-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อสมาชิก เช่น น้าแดง"
            className="flex-1 rounded-xl bg-black/[.03] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
          >
            เพิ่ม
          </button>
        </div>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        {copiedId === "new" && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            คัดลอกลิงก์ตั้งค่าแล้ว ส่งให้สมาชิกใหม่ได้เลย
          </p>
        )}
        {pendingLink?.id === "new" && (
          <p className="mt-2 break-all rounded-lg bg-black/[.03] p-2 text-xs text-muted">
            คัดลอกอัตโนมัติไม่สำเร็จ กรุณาคัดลอกลิงก์นี้เอง: {pendingLink.url}
          </p>
        )}
      </form>

      <ul className="space-y-3">
        {members.map((member) => {
          const isExpired = member.isExpired;

          return (
            <li
              key={member.id}
              className="rounded-2xl bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(member.id)}`}
                >
                  {getInitial(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {member.name}
                    {member.id === currentAdminId && (
                      <span className="ml-1 text-xs font-normal text-muted">
                        (คุณ)
                      </span>
                    )}
                  </p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.has_setup
                        ? "bg-emerald-100 text-emerald-700"
                        : isExpired
                          ? "bg-black/[.05] text-muted"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {member.has_setup
                      ? "ตั้ง PIN แล้ว"
                      : isExpired
                        ? "ยังไม่ได้ตั้งค่า"
                        : "รอตั้งค่า"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleResetLink(member.id)}
                  aria-label={member.has_setup ? "รีเซ็ต PIN" : "คัดลอกลิงก์ตั้งค่า"}
                  title={member.has_setup ? "รีเซ็ต PIN" : "คัดลอกลิงก์ตั้งค่า"}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 disabled:opacity-30"
                >
                  {copiedId === member.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={isPending || member.id === currentAdminId}
                  onClick={() => handleDelete(member.id, member.name)}
                  aria-label="ลบสมาชิก"
                  title="ลบสมาชิก"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {rowError?.id === member.id && (
                <p className="mt-2 text-sm text-red-600">{rowError.message}</p>
              )}
              {pendingLink?.id === member.id && (
                <p className="mt-2 break-all rounded-lg bg-black/[.03] p-2 text-xs text-muted">
                  คัดลอกอัตโนมัติไม่สำเร็จ กรุณาคัดลอกลิงก์นี้เอง: {pendingLink.url}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
