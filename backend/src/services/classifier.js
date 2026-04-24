const labels = {
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  EGGETARIAN: "Eggetarian",
  NON_VEGETARIAN: "Non-Vegetarian",
  UNCERTAIN: "Uncertain"
};

const preferenceRank = {
  Vegan: 0,
  Vegetarian: 1,
  Eggetarian: 2,
  "Non-Vegetarian": 3
};

const classificationRank = {
  Vegan: 0,
  Vegetarian: 1,
  Eggetarian: 2,
  "Non-Vegetarian": 3,
  Uncertain: 99
};

export function classifyIngredients(parsed, userPreference = "Vegan") {
  const knownMatches = parsed.ingredients.filter((item) => item.match);
  const animalMatches = knownMatches.filter((item) => item.match.source_type === "animal");
  const ambiguousMatches = knownMatches.filter((item) => item.match.source_type === "ambiguous");
  const nonVegetarianMatches = animalMatches.filter((item) =>
    ["meat", "fish"].includes(item.match.category)
  );
  const eggMatches = animalMatches.filter((item) => item.match.category === "egg");
  const dairyOrOtherAnimalMatches = animalMatches.filter(
    (item) => !["meat", "fish", "egg"].includes(item.match.category)
  );

  let classificationLabel = labels.VEGAN;
  if (parsed.ingredients.length === 0) {
    classificationLabel = labels.UNCERTAIN;
  } else if (nonVegetarianMatches.length > 0) {
    classificationLabel = labels.NON_VEGETARIAN;
  } else if (eggMatches.length > 0) {
    classificationLabel = labels.EGGETARIAN;
  } else if (dairyOrOtherAnimalMatches.length > 0) {
    classificationLabel = labels.VEGETARIAN;
  }

  const flaggedIngredients = [
    ...nonVegetarianMatches,
    ...eggMatches,
    ...dairyOrOtherAnimalMatches,
    ...ambiguousMatches
  ].map((item) => ({
    name: item.displayName,
    original: item.original,
    category: item.match.category,
    source_type: item.match.source_type,
    notes: item.match.notes
  }));

  const confidenceScore = calculateConfidence({
    classificationLabel,
    ingredientCount: parsed.ingredients.length,
    unknownCount: parsed.unknownIngredients.length,
    ambiguousCount: ambiguousMatches.length
  });

  const preferenceValidation = validatePreference({
    classificationLabel,
    confidenceScore,
    ambiguousCount: ambiguousMatches.length,
    userPreference
  });

  return {
    classification_label: classificationLabel,
    confidence_score: confidenceScore,
    flagged_ingredients: flaggedIngredients,
    preference_validation: preferenceValidation,
    explanation: buildExplanation({
      classificationLabel,
      flaggedIngredients,
      ambiguousMatches,
      userPreference,
      preferenceValidation
    })
  };
}

function calculateConfidence({ classificationLabel, ingredientCount, unknownCount, ambiguousCount }) {
  if (classificationLabel === labels.UNCERTAIN || ingredientCount === 0) return 0.18;

  const unknownPenalty = Math.min(0.2, unknownCount * 0.025);
  const ambiguousPenalty = Math.min(0.25, ambiguousCount * 0.08);
  const shortLabelPenalty = ingredientCount < 3 ? 0.06 : 0;
  return Number(Math.max(0.35, 0.96 - unknownPenalty - ambiguousPenalty - shortLabelPenalty).toFixed(2));
}

function validatePreference({ classificationLabel, confidenceScore, ambiguousCount, userPreference }) {
  if (classificationLabel === labels.UNCERTAIN) {
    return {
      status: "uncertain",
      is_suitable: false,
      message: "Ingredients could not be read reliably enough to validate this item."
    };
  }

  const allowedRank = preferenceRank[userPreference] ?? preferenceRank.Vegan;
  const itemRank = classificationRank[classificationLabel] ?? classificationRank.Uncertain;
  const rankSuitable = itemRank <= allowedRank;

  if (!rankSuitable) {
    return {
      status: "not_suitable",
      is_suitable: false,
      message: `This item does not fit a ${userPreference} preference.`
    };
  }

  if (ambiguousCount > 0 || confidenceScore < 0.75) {
    return {
      status: "caution",
      is_suitable: true,
      message: "Likely suitable, but at least one ingredient needs source confirmation."
    };
  }

  return {
    status: "suitable",
    is_suitable: true,
    message: `This item fits a ${userPreference} preference.`
  };
}

function buildExplanation({
  classificationLabel,
  flaggedIngredients,
  ambiguousMatches,
  userPreference,
  preferenceValidation
}) {
  if (classificationLabel === labels.UNCERTAIN) {
    return "Uncertain because the ingredient list was missing or unreadable.";
  }

  const animalFlags = flaggedIngredients.filter((item) => item.source_type === "animal");
  const firstAnimal = animalFlags[0];

  if (classificationLabel === labels.VEGAN && ambiguousMatches.length === 0) {
    return `No animal-derived ingredients were detected, so it appears Vegan and fits ${userPreference}.`;
  }

  if (classificationLabel === labels.VEGETARIAN && firstAnimal) {
    return `Vegetarian but not Vegan because it contains ${firstAnimal.name} (${firstAnimal.notes}).`;
  }

  if (classificationLabel === labels.EGGETARIAN && firstAnimal) {
    return `Eggetarian because it contains ${firstAnimal.name}; it has eggs but no meat or fish.`;
  }

  if (classificationLabel === labels.NON_VEGETARIAN && firstAnimal) {
    return `Non-Vegetarian because it contains ${firstAnimal.name} (${firstAnimal.notes}).`;
  }

  if (ambiguousMatches.length > 0) {
    return `${preferenceValidation.message} Ambiguous ingredient: ${ambiguousMatches[0].displayName}.`;
  }

  return preferenceValidation.message;
}
