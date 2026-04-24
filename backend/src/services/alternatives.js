import alternatives from "../../data/alternatives.json" with { type: "json" };

export function suggestAlternatives({ classification, parsed }) {
  const triggerCategories = new Set(
    classification.flagged_ingredients.map((item) => item.category)
  );

  const sugarSignal = parsed.ingredients.some((item) => item.match?.category === "sweetener");
  if (sugarSignal) triggerCategories.add("sweetener");

  return alternatives
    .filter((item) => triggerCategories.has(item.triggerCategory))
    .map((item) => item.message)
    .slice(0, 3);
}
