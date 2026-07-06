import { NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line/signature";
import { getMessageContent, getUserProfile, replyFlex, replyMessage } from "@/lib/line/client";
import { runReceiptOcr } from "@/lib/ocr/run-ocr";
import { normalizeOcrDate } from "@/lib/ocr/normalize-date";
import { createExpenseForMember } from "@/lib/expenses/create-expense";
import { matchCategoryId } from "@/lib/expenses/match-category";
import { isTokenExpired } from "@/lib/auth/setup-token";
import { generateSetupToken } from "@/lib/auth/pin";
import { SETUP_TOKEN_TTL_MS } from "@/lib/auth/constants";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { id: string; type: string; text?: string };
};

const SIGNUP_TRIGGER = "สร้างบัญชี";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const NOT_LINKED_HELP = `บัญชี LINE นี้ยังไม่ได้เชื่อมต่อ พิมพ์ "${SIGNUP_TRIGGER}" เพื่อสมัครสมาชิกใหม่`;

function buildReceiptSavedFlex(data: {
  merchantName: string;
  itemCount: number;
  total: number;
  editLink: string | null;
}): Record<string, unknown> {
  const bubble: Record<string, unknown> = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#C15F3C",
      paddingAll: "16px",
      contents: [
        { type: "text", text: "บันทึกใบเสร็จแล้ว", color: "#FFFFFF", weight: "bold", size: "md" },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: data.merchantName || "ไม่ระบุร้าน",
          weight: "bold",
          size: "lg",
          wrap: true,
          color: "#221E18",
        },
        {
          type: "text",
          text: `${data.itemCount} รายการ`,
          size: "sm",
          color: "#8A8072",
          margin: "xs",
        },
        { type: "separator", margin: "md" },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "ยอดรวม",
              size: "sm",
              color: "#8A8072",
              flex: 1,
              gravity: "center",
            },
            {
              type: "text",
              text: formatCurrency(data.total),
              size: "xxl",
              weight: "bold",
              align: "end",
              flex: 1,
              color: "#221E18",
            },
          ],
        },
      ],
    },
  };

  if (data.editLink) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#C15F3C",
          action: { type: "uri", label: "แก้ไขรายการ", uri: data.editLink },
        },
      ],
    };
  }

  return bubble;
}

async function handleFollow(event: LineEvent): Promise<void> {
  if (!event.replyToken) return;
  await replyMessage(
    event.replyToken,
    `สวัสดี! พิมพ์ "${SIGNUP_TRIGGER}" เพื่อสมัครสมาชิกและตั้งรหัส PIN\nหลังจากนั้นส่งรูปใบเสร็จมาที่แชทนี้ได้เลย ระบบจะอ่านรายการให้อัตโนมัติ`
  );
}

async function handleSignupRequest(replyToken: string, userId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    await replyMessage(replyToken, "ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("family_members")
    .select("id, has_setup, setup_token, setup_token_expires_at")
    .eq("line_user_id", userId)
    .maybeSingle();

  if (existing?.has_setup) {
    await replyMessage(replyToken, "คุณมีบัญชีอยู่แล้ว ส่งรูปใบเสร็จมาที่แชทนี้ได้เลย");
    return;
  }

  if (existing?.setup_token && !isTokenExpired(existing.setup_token_expires_at)) {
    await replyMessage(replyToken, `กดลิงก์นี้เพื่อตั้งรหัส PIN: ${appUrl}/setup/${existing.setup_token}`);
    return;
  }

  const setupToken = generateSetupToken();
  const expiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS).toISOString();

  if (existing) {
    await supabaseAdmin
      .from("family_members")
      .update({ setup_token: setupToken, setup_token_expires_at: expiresAt })
      .eq("id", existing.id);
  } else {
    const profile = await getUserProfile(userId);
    await supabaseAdmin.from("family_members").insert({
      name: profile?.displayName ?? "สมาชิกใหม่",
      is_admin: false,
      has_setup: false,
      line_user_id: userId,
      setup_token: setupToken,
      setup_token_expires_at: expiresAt,
    });
  }

  await replyMessage(replyToken, `กดลิงก์นี้เพื่อตั้งรหัส PIN: ${appUrl}/setup/${setupToken}`);
}

type QuickEntryItem = { itemName: string; amount: number };

function parseQuickEntryText(text: string): QuickEntryItem[] {
  const items: QuickEntryItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^(.+?)\s+([\d,]+(?:\.\d+)?)\s*(?:บาท)?$/u);
    if (!match) continue;
    const itemName = match[1].trim();
    const amount = Number(match[2].replace(/,/g, ""));
    if (!itemName || !(amount > 0)) continue;
    items.push({ itemName, amount });
  }
  return items;
}

async function handleQuickEntry(
  replyToken: string,
  userId: string,
  quickItems: QuickEntryItem[]
): Promise<void> {
  const { data: member } = await supabaseAdmin
    .from("family_members")
    .select("id")
    .eq("line_user_id", userId)
    .maybeSingle();

  if (!member) {
    await replyMessage(replyToken, NOT_LINKED_HELP);
    return;
  }

  const items = quickItems.map((item) => ({
    categoryId: null,
    itemName: item.itemName,
    amount: item.amount,
    quantity: 1,
  }));
  const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);

  const createResult = await createExpenseForMember(member.id, {
    merchantName: "",
    purchaseDate: todayIso(),
    totalAmount: total,
    source: "manual",
    items,
  });

  if ("error" in createResult) {
    await replyMessage(replyToken, `บันทึกไม่สำเร็จ: ${createResult.error}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const editLink = appUrl ? `${appUrl}/expenses/${createResult.receiptId}` : null;

  await replyFlex(
    replyToken,
    `บันทึกรายการแล้ว ${formatCurrency(total)}`,
    buildReceiptSavedFlex({ merchantName: "", itemCount: items.length, total, editLink })
  );
}

async function handleText(event: LineEvent): Promise<void> {
  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const text = event.message?.text?.trim() ?? "";
  if (!replyToken) return;

  if (userId && text === SIGNUP_TRIGGER) {
    await handleSignupRequest(replyToken, userId);
    return;
  }

  const quickItems = parseQuickEntryText(text);
  if (userId && quickItems.length > 0) {
    await handleQuickEntry(replyToken, userId, quickItems);
    return;
  }

  await replyMessage(
    replyToken,
    `ส่งรูปใบเสร็จ หรือพิมพ์ "ชื่อสินค้า ราคา" เช่น "กาแฟ 150" เพื่อบันทึกอย่างเร็ว หรือพิมพ์ "${SIGNUP_TRIGGER}" ถ้ายังไม่มีบัญชี`
  );
}

async function handleImage(event: LineEvent): Promise<void> {
  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const messageId = event.message?.id;
  if (!replyToken || !userId || !messageId) return;

  const { data: member } = await supabaseAdmin
    .from("family_members")
    .select("id")
    .eq("line_user_id", userId)
    .maybeSingle();

  if (!member) {
    await replyMessage(replyToken, NOT_LINKED_HELP);
    return;
  }

  const { data: imageBytes } = await getMessageContent(messageId);
  const ocrResult = await runReceiptOcr(imageBytes);

  if ("error" in ocrResult) {
    await replyMessage(replyToken, `อ่านใบเสร็จไม่สำเร็จ: ${ocrResult.error}`);
    return;
  }

  if ("message" in ocrResult) {
    await replyMessage(replyToken, ocrResult.message);
    return;
  }

  if (ocrResult.items.length === 0) {
    await replyMessage(
      replyToken,
      "อ่านใบเสร็จไม่พบรายการสินค้า กรุณาลองถ่ายใหม่หรือกรอกเองในเว็บแอป"
    );
    return;
  }

  const { data: categories } = await supabaseAdmin.from("categories").select("id, name");
  const items = ocrResult.items.map((item) => ({
    categoryId: matchCategoryId(categories ?? [], item.category),
    itemName: item.name,
    amount: item.price,
    quantity: 1,
  }));

  const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);

  const createResult = await createExpenseForMember(member.id, {
    merchantName: ocrResult.store ?? "",
    purchaseDate: normalizeOcrDate(ocrResult.date) ?? todayIso(),
    totalAmount: total,
    source: "ocr",
    items,
  });

  if ("error" in createResult) {
    await replyMessage(replyToken, `บันทึกไม่สำเร็จ: ${createResult.error}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const editLink = appUrl ? `${appUrl}/expenses/${createResult.receiptId}` : null;
  const merchantName = ocrResult.store ?? "";

  await replyFlex(
    replyToken,
    `บันทึกใบเสร็จแล้ว ${merchantName || "ไม่ระบุร้าน"} ${formatCurrency(total)}`,
    buildReceiptSavedFlex({ merchantName, itemCount: items.length, total, editLink })
  );
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body: { events?: LineEvent[] } = JSON.parse(rawBody);

  await Promise.all(
    (body.events ?? []).map(async (event) => {
      try {
        if (event.type === "follow") {
          await handleFollow(event);
        } else if (event.type === "message" && event.message?.type === "text") {
          await handleText(event);
        } else if (event.type === "message" && event.message?.type === "image") {
          await handleImage(event);
        }
      } catch (error) {
        console.error("Error handling LINE event:", error);
      }
    })
  );

  return NextResponse.json({ ok: true });
}
