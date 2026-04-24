const sugarKeywords = ["sugar", "syrup", "fructose", "glucose", "dextrose", "honey", "molasses"];
const proteinKeywords = ["protein", "whey", "casein", "soy", "pea", "chickpea", "lentil", "milk", "egg"];

export function estimateNutrition({ nutritionInput = {}, parsed }) {
  const providedSugar = toNumberOrNull(nutritionInput.sugarGrams);
  const providedProtein = toNumberOrNull(nutritionInput.proteinGrams);
  const ocrNutrition = extractNutritionFromText(parsed.rawText);

  const ingredientNames = parsed.ingredients.map((item) => item.normalized);
  const sugarHits = ingredientNames.filter((name) =>
    sugarKeywords.some((keyword) => name.includes(keyword))
  ).length;
  const proteinHits = ingredientNames.filter((name) =>
    proteinKeywords.some((keyword) => name.includes(keyword))
  ).length;

  const sugarEstimate = Math.min(42, Math.max(0, 2 + sugarHits * 7));
  const proteinEstimate = Math.min(38, Math.max(1, 3 + proteinHits * 5));

  const sugar = providedSugar ?? ocrNutrition.sugar_g ?? sugarEstimate;
  const protein = providedProtein ?? ocrNutrition.protein_g ?? proteinEstimate;
  const source = getNutritionSource({ providedSugar, providedProtein, ocrNutrition });

  return {
    sugar_g: sugar,
    protein_g: protein,
    source,
    notes: getNutritionNotes(source, ocrNutrition)
  };
}

export function extractNutritionFromText(rawText = "") {
  const normalized = normalizeNutritionText(rawText);
  const sugar = findMacroValue(normalized, "sugar");
  const protein = findMacroValue(normalized, "protein");

  return {
    sugar_g: sugar,
    protein_g: protein
  };
}

export function calculateDailySummary({ profile, scans, date = new Date() }) {
  const targetDate = toDateKey(date);
  const todaysScans = scans.filter((scan) => toDateKey(scan.created_at) === targetDate);
  const sugarConsumed = roundOne(
    todaysScans.reduce((total, scan) => total + Number(scan.nutrition?.sugar_g ?? 0), 0)
  );
  const proteinConsumed = roundOne(
    todaysScans.reduce((total, scan) => total + Number(scan.nutrition?.protein_g ?? 0), 0)
  );

  const sugarGoal = Number(profile.sugar_goal_g);
  const proteinGoal = Number(profile.protein_goal_g);

  return {
    date: targetDate,
    sugar: buildMacroSummary("sugar", sugarConsumed, sugarGoal),
    protein: buildMacroSummary("protein", proteinConsumed, proteinGoal),
    scan_count: todaysScans.length
  };
}

function buildMacroSummary(name, consumed, goal) {
  const percent = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
  return {
    consumed_g: consumed,
    goal_g: goal,
    percent_used: percent,
    status: consumed > goal ? "exceeded" : percent >= 85 ? "near_limit" : "within_goal",
    warning:
      consumed > goal
        ? `${capitalize(name)} goal exceeded.`
        : percent >= 85
          ? `${capitalize(name)} is close to the daily goal.`
          : ""
  };
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeNutritionText(rawText) {
  return rawText
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/\r/g, "\n")
    .replace(/[|•]/g, " ")
    .replace(/\bOg\b/g, "0g")
    .replace(/\bO\s*g\b/gi, "0g")
    .replace(/(\d)\s+g\b/gi, "$1g")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findMacroValue(text, macro) {
  const patterns =
    macro === "sugar"
      ? [
          /\btotal\s+sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g\b/gi,
          /\bsugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g\b/gi
        ]
      : [/\bprotein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g\b/gi];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    const match = matches.find((candidate) => {
      const before = text.slice(Math.max(0, candidate.index - 18), candidate.index);
      return macro !== "sugar" || !/\b(added|includes|alcohol)\s*$/.test(before);
    });
    const value = toNumberOrNull(match?.[1]);
    if (value !== null && value <= 250) {
      return value;
    }
  }

  return null;
}

function getNutritionSource({ providedSugar, providedProtein, ocrNutrition }) {
  if (providedSugar !== null || providedProtein !== null) return "label-input";
  if (ocrNutrition.sugar_g !== null || ocrNutrition.protein_g !== null) return "label-ocr";
  return "ingredient-estimate";
}

function getNutritionNotes(source, ocrNutrition) {
  if (source === "label-input") {
    return "Using nutrition values supplied with the scan.";
  }

  if (source === "label-ocr") {
    const missing = [
      ocrNutrition.sugar_g === null ? "sugar" : "",
      ocrNutrition.protein_g === null ? "protein" : ""
    ].filter(Boolean);

    return missing.length > 0
      ? `Read nutrition values from OCR and estimated missing ${missing.join(" and ")} from ingredients.`
      : "Read sugar and protein directly from the nutrition label OCR.";
  }

  return "Estimated from ingredient signals. Use barcode lookup or clear nutrition label photos for higher accuracy.";
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
