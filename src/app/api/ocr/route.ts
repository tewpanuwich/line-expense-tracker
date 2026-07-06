import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/session-server";
import { runReceiptOcr } from "@/lib/ocr/run-ocr";
import { matchCategoryId } from "@/lib/expenses/match-category";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบรูปภาพในคำขอ" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const result = await runReceiptOcr(bytes);

  if ("error" in result) {
    return NextResponse.json(result, { status: 502 });
  }

  if ("items" in result && result.items.length > 0) {
    const { data: categories } = await supabaseAdmin.from("categories").select("id, name");
    const items = result.items.map((item) => ({
      ...item,
      categoryId: matchCategoryId(categories ?? [], item.category),
    }));
    return NextResponse.json({ ...result, items });
  }

  return NextResponse.json(result);
}
