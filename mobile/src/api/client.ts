import type { DailySummary, Preference, Profile, Scan } from "../types";

const API_ROOT = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as T;
}

export const api = {
  getProfile: () => request<Profile>("/profile"),
  updateProfile: (profile: {
    preference: Preference;
    sugar_goal_g: number;
    protein_goal_g: number;
  }) =>
    request<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    }),
  getSummary: () => request<DailySummary>("/summary"),
  getHistory: async () => {
    const payload = await request<{ scans: Scan[] }>("/history");
    return payload.scans;
  },
  scanText: (input: {
    productName?: string;
    rawText: string;
    sugarGrams?: number;
    proteinGrams?: number;
  }) =>
    request<Scan>("/scan/text", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  scanImage: (input: {
    uri: string;
    productName?: string;
    sugarGrams?: number;
    proteinGrams?: number;
  }) =>
    api.scanImages({
      images: [{ uri: input.uri }],
      productName: input.productName,
      sugarGrams: input.sugarGrams,
      proteinGrams: input.proteinGrams
    }),
  scanImages: (input: {
    images: { uri: string; fileName?: string | null; mimeType?: string | null }[];
    productName?: string;
    sugarGrams?: number;
    proteinGrams?: number;
  }) => {
    const formData = new FormData();
    input.images.forEach((image, index) => {
      formData.append("labelImages", {
        uri: image.uri,
        name: image.fileName ?? `ingredient-label-${index + 1}.jpg`,
        type: image.mimeType ?? "image/jpeg"
      } as unknown as Blob);
    });
    if (input.productName) formData.append("productName", input.productName);
    if (input.sugarGrams !== undefined) formData.append("sugarGrams", String(input.sugarGrams));
    if (input.proteinGrams !== undefined) formData.append("proteinGrams", String(input.proteinGrams));

    return request<Scan>("/scan/image", {
      method: "POST",
      body: formData
    });
  },
  scanBarcode: (barcode: string) =>
    request<Scan>("/scan/barcode", {
      method: "POST",
      body: JSON.stringify({ barcode })
    })
};
