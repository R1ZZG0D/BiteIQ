import { createWorker } from "tesseract.js";

export async function extractTextFromImage(buffer, mimeType = "image/jpeg") {
  if (!buffer?.length) {
    throw new Error("No image data received for OCR.");
  }

  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(Buffer.from(buffer), { mimeType });
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}
