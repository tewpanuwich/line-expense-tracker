@AGENTS.md

## `/api/ocr` mock response

`src/app/api/ocr/route.ts` calls Google Vision + Gemini (real network calls, real cost).
For local UI/client testing without hitting either API, stub `window.fetch` in the browser
console (or via `preview_eval`) to short-circuit `POST /api/ocr` with this shape instead —
it matches the `{ items, store, date }` structure the route actually returns on success:

```json
{
  "items": [
    { "name": "โยเกิร์ตน้ำผึ้ง", "price": 59.0 },
    { "name": "ข้าวหอมมะลิ", "price": 12.0 },
    { "name": "วิกซอลออกซี่", "price": 42.0 },
    { "name": "ซิลค์ทิชชู่แขวน", "price": 55.0 }
  ],
  "store": "Tops Theprak",
  "date": "2026-07-04"
}
```

Empty-OCR edge case (route returns this when Vision found no text at all):

```json
{ "items": [], "total": 0, "message": "ไม่พบตัวอักษรใดๆ ในใบเสร็จใบนี้" }
```
