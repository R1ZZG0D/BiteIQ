import { parseIngredients } from "./parser.js";
import { classifyIngredients } from "./classifier.js";
import { estimateNutrition } from "./nutrition.js";
import { suggestAlternatives } from "./alternatives.js";

export function analyzeScan({
  rawText,
  productName = "Scanned product",
  nutritionInput = {},
  userPreference = "Vegan"
}) {
  const parsed = parseIngredients(rawText);
  const classification = classifyIngredients(parsed, userPreference);
  const nutrition = estimateNutrition({ nutritionInput, parsed });
  const alternatives = suggestAlternatives({ classification, parsed });

  return {
    product_name: productName || "Scanned product",
    parsed,
    result: {
      ...classification,
      alternatives
    },
    nutrition
  };
}
