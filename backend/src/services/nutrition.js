const sugarKeywords = ["sugar", "syrup", "fructose", "glucose", "dextrose", "honey", "molasses"];
const proteinKeywords = ["protein", "whey", "casein", "soy", "pea", "chickpea", "lentil", "milk", "egg"];

export function estimateNutrition({ nutritionInput = {}, parsed }) {
  const providedSugar = toNumberOrNull(nutritionInput.sugarGrams);
  const providedProtein = toNumberOrNull(nutritionInput.proteinGrams);

  const ingredientNames = parsed.ingredients.map((item) => item.normalized);
  const sugarHits = ingredientNames.filter((name) =>
    sugarKeywords.some((keyword) => name.includes(keyword))
  ).length;
  const proteinHits = ingredientNames.filter((name) =>
    proteinKeywords.some((keyword) => name.includes(keyword))
  ).length;

  const sugarEstimate = Math.min(42, Math.max(0, 2 + sugarHits * 7));
  const proteinEstimate = Math.min(38, Math.max(1, 3 + proteinHits * 5));

  return {
    sugar_g: providedSugar ?? sugarEstimate,
    protein_g: providedProtein ?? proteinEstimate,
    source: providedSugar !== null || providedProtein !== null ? "label-input" : "ingredient-estimate",
    notes:
      providedSugar !== null || providedProtein !== null
        ? "Using nutrition values supplied with the scan."
        : "Estimated from ingredient signals. Use barcode lookup or label values for higher accuracy."
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

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
