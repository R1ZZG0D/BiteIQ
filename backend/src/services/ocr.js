import { createWorker, PSM } from "tesseract.js";

export async function extractTextFromImage(buffer, mimeType = "image/jpeg") {
  if (!buffer?.length) {
    throw new Error("No image data received for OCR.");
  }

  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300"
    });
    const result = await worker.recognize(Buffer.from(buffer), { mimeType });
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}
