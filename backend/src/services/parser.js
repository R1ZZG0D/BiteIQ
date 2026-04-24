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

const plantMilkPattern =
  /\b(oat|almond|soy|soya|coconut|cashew|rice|pea|hemp|macadamia|plant based|plant-based|dairy free|dairy-free|non dairy|non-dairy)\s+milk\b|\bmilk\s+(alternative|beverage)\b/;

const strongLabelSignals = [
  {
    ingredientId: "milk",
    pattern:
      /\b(grade a milk|whole milk|reduced fat milk|lowfat milk|low fat milk|skim milk|nonfat milk|evaporated milk|condensed milk|cultured milk|milkfat|milk chocolate|cream|yogurt|yoghurt|curd)\b/i,
    shouldSkip: (normalizedText) => plantMilkPattern.test(normalizedText)
  },
  {
    ingredientId: "egg",
    pattern: /\b(whole egg|egg whites?|egg yolks?|albumen|ovalbumin)\b/i
  },
  {
    ingredientId: "gelatin",
    pattern: /\b(gelatin|gelatine)\b/i
  }
];

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

export function extractContainsSegments(rawText = "") {
  const cleaned = cleanOcrText(rawText);
  const matches = [...cleaned.matchAll(/\bcontains\s*[:\-]?\s*([^.;]{2,140})/gi)];

  return matches
    .map((match) => match[1] ?? "")
    .map((segment) =>
      segment
        .replace(/\b(may contain|nutrition facts|serving size|calories|manufactured|distributed)\b.*$/i, "")
        .trim()
    )
    .filter((segment) => {
      const normalized = normalizeTerm(segment);
      return (
        !normalized.startsWith("2 or less") &&
        /\b(milk|egg|whey|casein|lactose|gelatin|fish|shellfish|beef|pork|chicken)\b/.test(normalized)
      );
    });
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

  const match = aliasIndex.find(({ ingredient, normalizedAlias }) => {
    if (ingredient.id === "milk" && plantMilkPattern.test(parsedIngredient.normalized)) {
      return false;
    }

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
  const allergenIngredients = extractContainsSegments(cleanedText).flatMap((segment) =>
    splitIngredients(segment).map((item) => ({
      ...item,
      original: `Contains ${item.original}`
    }))
  );
  const labelSignals = extractStrongLabelSignals(cleanedText);
  const split = dedupeParsedInputs([
    ...splitIngredients(ingredientSegment),
    ...allergenIngredients,
    ...labelSignals
  ]);
  const parsed = split.map((item) => {
    const match = item.match ?? matchKnownIngredient(item);
    return {
      ...item,
      displayName: match?.name ?? item.original,
      known: Boolean(match),
      match
    };
  });
  const dedupedParsed = dedupeMatchedIngredients(parsed);

  return {
    rawText: cleanedText,
    ingredientSegment,
    ingredients: dedupedParsed,
    unknownIngredients: dedupedParsed.filter((item) => !item.known).map((item) => item.original),
    ambiguousIngredients: dedupedParsed
      .filter((item) => item.match?.source_type === "ambiguous")
      .map((item) => item.displayName)
  };
}

export function getIngredientKnowledgeBase() {
  return ingredients;
}

function extractStrongLabelSignals(rawText = "") {
  const normalizedText = normalizeTerm(rawText);

  return strongLabelSignals.flatMap((signal) => {
    if (signal.shouldSkip?.(normalizedText) || !signal.pattern.test(rawText)) {
      return [];
    }

    const ingredient = ingredients.find((item) => item.id === signal.ingredientId);
    if (!ingredient) return [];

    return [
      {
        original: ingredient.name,
        normalized: normalizeTerm(ingredient.name),
        displayName: ingredient.name,
        known: true,
        match: {
          ...ingredient,
          matched_alias: "label signal"
        }
      }
    ];
  });
}

function dedupeParsedInputs(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.match?.id ?? item.normalized;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeMatchedIngredients(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.match?.id ?? item.normalized;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
