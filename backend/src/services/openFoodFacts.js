import { config } from "../config.js";

export async function fetchProductByBarcode(barcode) {
  const cleanBarcode = String(barcode ?? "").replace(/\D/g, "");
  if (!cleanBarcode) {
    throw new Error("A numeric barcode is required.");
  }

  const url = `${config.openFoodFactsBaseUrl}/product/${cleanBarcode}.json?fields=product_name,ingredients_text,nutriments`;
  const response = await fetch(url, {
    headers: { "User-Agent": "FoodIntelligenceMVP/1.0" }
  });

  if (!response.ok) {
    throw new Error(`OpenFoodFacts lookup failed with status ${response.status}.`);
  }

  const payload = await response.json();
  if (!payload.product) {
    throw new Error("Product not found in OpenFoodFacts.");
  }

  const product = payload.product;
  return {
    productName: product.product_name || `Barcode ${cleanBarcode}`,
    rawText: product.ingredients_text || "",
    nutritionInput: {
      sugarGrams: product.nutriments?.sugars_100g,
      proteinGrams: product.nutriments?.proteins_100g
    },
    barcode: cleanBarcode
  };
}
