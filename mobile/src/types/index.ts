export type Preference = "Vegan" | "Vegetarian" | "Eggetarian" | "Non-Vegetarian";

export type Profile = {
  id: string;
  preference: Preference;
  sugar_goal_g: number;
  protein_goal_g: number;
  updated_at: string;
};

export type MacroSummary = {
  consumed_g: number;
  goal_g: number;
  percent_used: number;
  status: "within_goal" | "near_limit" | "exceeded";
  warning: string;
};

export type DailySummary = {
  date: string;
  sugar: MacroSummary;
  protein: MacroSummary;
  scan_count: number;
};

export type ParsedIngredient = {
  original: string;
  normalized: string;
  displayName: string;
  known: boolean;
  match?: {
    id: string;
    name: string;
    category: string;
    source_type: "plant" | "animal" | "ambiguous";
    notes: string;
  } | null;
};

export type ParsedResult = {
  rawText: string;
  ingredientSegment: string;
  ingredients: ParsedIngredient[];
  unknownIngredients: string[];
  ambiguousIngredients: string[];
};

export type FlaggedIngredient = {
  name: string;
  original: string;
  category: string;
  source_type: "plant" | "animal" | "ambiguous";
  notes: string;
};

export type ScanResult = {
  classification_label: Preference | "Uncertain";
  confidence_score: number;
  flagged_ingredients: FlaggedIngredient[];
  preference_validation: {
    status: "suitable" | "not_suitable" | "caution" | "uncertain";
    is_suitable: boolean;
    message: string;
  };
  explanation: string;
  alternatives: string[];
};

export type Nutrition = {
  sugar_g: number;
  protein_g: number;
  source: "label-input" | "label-ocr" | "ingredient-estimate";
  notes: string;
};

export type Scan = {
  id: string;
  product_name: string;
  raw_text: string;
  parsed: ParsedResult;
  result: ScanResult;
  nutrition: Nutrition;
  created_at: string;
};
