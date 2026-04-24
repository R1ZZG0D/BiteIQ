import ingredients from "../../data/ingredients.json" with { type: "json" };

const aliasIndex = ingredients
  .flatMap((ingredient) =>
    [ingredient.name, ...(ingredient.aliases ?? [])].map((alias) => ({
      alias,
      normalizedAlias: normalizeTerm(alias),
      ingredient
    }))
  )
  .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);

export function cleanOcrText(rawText = "") {
  return rawText
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/\r/g, "\n")
    .replace(/\bmono\s*-\s*and\s+diglycerides\b/gi, "mono and diglycerides")
    .replace(/\bmono\s+and\s+diglycerides\b/gi, "mono and diglycerides")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTerm(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\bpowdered\b/g, "powder")
    .replace(/\bflavours\b/g, "flavors")
    .replace(/\bflavour\b/g, "flavor")
    .replace(/\bmono\s*-\s*and\b/g, "mono and")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractIngredientSegment(rawText = "") {
  const cleaned = cleanOcrText(rawText);
  if (!cleaned) return "";

  const ingredientStart = cleaned.search(/\bingredients?\s*[:.-]/i);
  const segment = ingredientStart >= 0
    ? cleaned.slice(ingredientStart).replace(/^ingredients?\s*[:.-]\s*/i, "")
    : cleaned;

  const stopAt = segment.search(
    /\b(nutrition facts|contains:|allergen information|manufactured|distributed by|serving size|calories)\b/i
  );

  return stopAt >= 0 ? segment.slice(0, stopAt).trim() : segment.trim();
}

export function splitIngredients(segment = "") {
  const sanitized = segment
    .replace(/\(([^)]*)\)/g, " $1 ")
    .replace(/\bcontains\s+2%\s+or\s+less\s+of\b/gi, ",")
    .replace(/\bmay contain\b/gi, ", may contain ")
    .replace(/[•|]/g, ",")
    .replace(/\n+/g, ",");

  return sanitized
    .split(/[,;]+/)
    .map((part) =>
      part
        .replace(/\b(and\/or|and or)\b/gi, " ")
        .replace(/\borganic\b/gi, " ")
        .replace(/\bcontains\b/gi, " ")
        .trim()
    )
    .filter(Boolean)
    .map((original) => ({
      original,
      normalized: normalizeTerm(original)
    }))
    .filter((item) => item.normalized.length > 1);
}

export function matchKnownIngredient(parsedIngredient) {
  const token = ` ${parsedIngredient.normalized} `;

  const soyLecithinPattern =
    parsedIngredient.normalized.includes("lecithin") &&
    /\b(soy|soya)\b/.test(parsedIngredient.normalized);
  if (soyLecithinPattern) {
    const soyLecithin = ingredients.find((item) => item.id === "soy-lecithin");
    return { ...soyLecithin, matched_alias: "soy lecithin" };
  }

  const match = aliasIndex.find(({ normalizedAlias }) => {
    const aliasToken = ` ${normalizedAlias} `;
    return token.includes(aliasToken) || parsedIngredient.normalized === normalizedAlias;
  });

  return match
    ? { ...match.ingredient, matched_alias: match.alias }
    : null;
}

export function parseIngredients(rawText = "") {
  const cleanedText = cleanOcrText(rawText);
  const ingredientSegment = extractIngredientSegment(cleanedText);
  const split = splitIngredients(ingredientSegment);
  const parsed = split.map((item) => {
    const match = matchKnownIngredient(item);
    return {
      ...item,
      displayName: match?.name ?? item.original,
      known: Boolean(match),
      match
    };
  });

  return {
    rawText: cleanedText,
    ingredientSegment,
    ingredients: parsed,
    unknownIngredients: parsed.filter((item) => !item.known).map((item) => item.original),
    ambiguousIngredients: parsed
      .filter((item) => item.match?.source_type === "ambiguous")
      .map((item) => item.displayName)
  };
}

export function getIngredientKnowledgeBase() {
  return ingredients;
}
