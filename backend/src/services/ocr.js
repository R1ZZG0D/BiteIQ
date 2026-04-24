import { createWorker, PSM } from "tesseract.js";

export async function extractTextFromImage(buffer, mimeType = "image/jpeg") {
  if (!buffer?.length) {
    throw createOcrInputError("No image data received for OCR.");
  }

  const format = detectImageFormat(buffer);
  if (!format) {
    throw createOcrInputError(
      "Unsupported image format for OCR. Please upload JPEG or PNG photos."
    );
  }

  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300"
    });
    const result = await worker.recognize(Buffer.from(buffer), {
      mimeType: format === "png" ? "image/png" : mimeType
    });
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

function detectImageFormat(buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  return null;
}

function createOcrInputError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
