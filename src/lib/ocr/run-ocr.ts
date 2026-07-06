import sharp from "sharp";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for the disabled Vision block below, restore when re-enabling
const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
const GEMINI_IMAGE_MAX_DIMENSION = 2000;
const GEMINI_IMAGE_QUALITY = 85;

type OcrItem = { name: string; price: number; discount: number; category: string };

const CATEGORY_LABELS = [
  "การศึกษา",
  "ของใช้ในบ้าน",
  "ช้อปปิ้ง",
  "เดินทาง",
  "บันเทิง",
  "สุขภาพ",
  "อาหาร",
  "อื่นๆ",
];

type OcrSuccess = {
  items: OcrItem[];
  store: string;
  date: string | number;
};

type OcrEmpty = {
  items: [];
  total: 0;
  message: string;
};

type OcrFailure = {
  error: string;
};

export async function runReceiptOcr(
  imageBytes: ArrayBuffer
): Promise<OcrSuccess | OcrEmpty | OcrFailure> {
  // const visionApiKey = process.env.GOOGLE_VISION_API_KEY; // DISABLED FOR GEMINI-ONLY SPEED TEST
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return {
      error: "ระบบยังตั้งค่า API Key ไม่ครบถ้วน (ต้องการ GEMINI_API_KEY)",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for the disabled Vision block below, restore when re-enabling
  const base64Content = Buffer.from(imageBytes).toString("base64");

  try {
    /* ===== DISABLED FOR GEMINI-ONLY SPEED TEST — DO NOT DELETE, RESTORE WHEN DONE COMPARING =====

    // STEP 1: เรียก Cloud Vision API ด้วยภาพต้นฉบับความละเอียดเต็ม เพื่อความแม่นยำสูงสุด
    const visionStartedAt = Date.now();
    const visionResponse = await fetch(`${VISION_ENDPOINT}?key=${visionApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Content },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }], // เหมาะกับข้อความหนาแน่น เช่น ใบเสร็จ
            imageContext: { languageHints: ["th", "en"] },
          },
        ],
      }),
    });
    console.log(`[OCR timing] Vision call took ${Date.now() - visionStartedAt}ms`);

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.text();
      console.error("Google Vision API error:", visionResponse.status, errorBody);
      return { error: "ขั้นตอนการทำ OCR ล้มเหลว (ตรวจสอบบัญชี Billing)" };
    }

    const visionData = await visionResponse.json();
    const fullText: string = visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";

    if (!fullText) {
      return { items: [], total: 0, message: "ไม่พบตัวอักษรใดๆ ในใบเสร็จใบนี้" };
    }

    // STEP 2: ส่งทั้งก้อน Text OCR และ รูปภาพที่ย่อขนาดแล้ว เข้าไปให้ Gemini วิเคราะห์และจับคู่ข้อมูล
    const geminiEndpointWithVision = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const promptWithVision = `Analyze the attached receipt image and the Raw OCR Text below.
Match each product with its correct price and output strictly as a JSON object.

Rules:
1. [Alignment]: Use the receipt image's layout alignment to match product names with their corresponding prices on the right.
2. [Product Name]: Base names on the Raw OCR Text. Do not hallucinate. Correct any typos or broken characters caused by OCR using context.
3. [Price]: Read prices ONLY from the image. Do not use prices from the Raw OCR Text due to formatting issues.
4. [Discounts]: Look for items with price deductions (same line, next line, or bottom). These can be negative numbers, labeled (e.g., "Discount", "ลด", "DISC", "RD"), or just a secondary lower price under the item. Calculate the final net price for "price". Do not create separate rows for discounts.
5. [Noise]: Exclude non-product data (e.g., receipt ID, tax ID, store branch, membership details).
6. [Total Verification]: Find the final grand total paid on the receipt. Sum up all individual item prices you extracted. If they do not match the grand total, re-read the individual prices from the image to resolve the discrepancy.

Output ONLY the following JSON structure without any conversational text:
{
  "items": [
    { "name": "Product Name", "price": 0.0 }
  ],
  "date": "Receipt Date",
  "store": "Store Name",
  "total_on_receipt": 0.0
}

Raw OCR Text:
${fullText}`;
    console.log(fullText);

    ===== END DISABLED BLOCK ===== */

    // ย่อขนาดภาพก่อนส่งให้ Gemini เพื่อลดเวลาประมวลผล
    const resizedImageBuffer = await sharp(Buffer.from(imageBytes))
      .resize({
        width: GEMINI_IMAGE_MAX_DIMENSION,
        height: GEMINI_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: GEMINI_IMAGE_QUALITY })
      .toBuffer();
    const geminiImageBase64 = resizedImageBuffer.toString("base64");

    // ===== GEMINI-ONLY SPEED TEST: skip Vision entirely, Gemini reads the image directly =====
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `Analyze the attached image directly (no separate OCR text is provided).

First, determine whether the image is actually a photo of a receipt/invoice/bill (a document proving a purchase, with line items and/or a total amount). It is NOT a receipt if it's a random photo, a selfie, a screenshot of something unrelated, a product photo, or any document that isn't proof of purchase. Set "is_receipt" to false in that case and leave "items" as an empty array.

If it IS a receipt, match each product with its correct price and output strictly as a JSON object.

Rules:
1. [Alignment]: Use the receipt image's layout alignment to match product names with their corresponding prices on the right.
2. [Product Name]: Read product names directly from the image. Do not hallucinate items that aren't visible. Correct any characters you are unsure of using context.
3. [Price]: Read prices directly from the image.
4. [Discounts]: Look for items with price deductions (same line, next line, or bottom). These can be negative numbers, labeled (e.g., "Discount", "ลด", "DISC", "RD"), or just a secondary lower price under the item. Report the deducted amount as "discount" (0 if none), and set "price" to the final net price after subtracting it. Do not create separate rows for discounts.
5. [Category]: Classify each item into exactly one of these categories based on what the product is: ${CATEGORY_LABELS.join(", ")}. Use "อื่นๆ" only when nothing else fits.
6. [Noise]: Exclude non-product data (e.g., receipt ID, tax ID, store branch, membership details).
7. [Total Verification]: Find the final grand total paid on the receipt. Sum up all individual item prices you extracted. If they do not match the grand total, re-read the individual prices from the image to resolve the discrepancy.

Output ONLY the following JSON structure without any conversational text:
{
  "is_receipt": true,
  "items": [
    { "name": "Product Name", "price": 0.0, "discount": 0.0, "category": "อาหาร" }
  ],
  "date": "Receipt Date",
  "store": "Store Name",
  "total_on_receipt": 0.0
}`;

    const geminiStartedAt = Date.now();
    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: geminiImageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json", // บังคับคืนค่าเป็น Structured JSON
          temperature: 0.1, // ปรับให้ต่ำมาก เพื่อลดความสร้างสรรค์ เน้นความถูกต้องตามความจริง
          thinkingConfig: { thinkingBudget: 2048 }, // ปิด thinking (0) ทำให้โมเดลอ่านส่วนลดไม่ออกเลย (คืน discount เป็น 0 ทุกครั้ง) จึงต้องเปิด thinking แบบจำกัดไว้เพื่อให้ตรวจจับส่วนลดได้ แลกกับเวลาตอบที่ไม่คงที่
        },
      }),
    });
    console.log(`[OCR timing] Gemini-only call took ${Date.now() - geminiStartedAt}ms`);

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", errorBody);
      return { error: "ขั้นตอนการวิเคราะห์ด้วย AI ล้มเหลว" };
    }

    const geminiData = await geminiResponse.json();
    const aiResultString = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    // แปลง String JSON ที่ได้จาก Gemini ออกมาเป็น Object ของ JavaScript
    const receiptData = JSON.parse(aiResultString);
    console.log(receiptData);

    if (receiptData.is_receipt === false) {
      return {
        items: [],
        total: 0,
        message: "รูปนี้ไม่ใช่ใบเสร็จ กรุณาส่งรูปใบเสร็จที่ชัดเจน",
      };
    }

    const items: OcrItem[] = (receiptData.items ?? []).map(
      (item: { name?: string; price?: number; discount?: number; category?: string }) => ({
        name: item.name ?? "",
        price: item.price ?? 0,
        discount: item.discount ?? 0,
        category: CATEGORY_LABELS.includes(item.category ?? "") ? item.category! : "อื่นๆ",
      })
    );

    return {
      items,
      store: receiptData.store ?? "",
      date: receiptData.date ?? Date.now(),
    };
  } catch (error) {
    console.error("Internal Server Error during processing:", error);
    return { error: "เกิดข้อผิดพลาดภายในระบบในการประมวลผลข้อมูล" };
  }
}
