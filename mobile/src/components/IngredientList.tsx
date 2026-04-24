import { StyleSheet, Text, View } from "react-native";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react-native";
import { colors } from "../theme/colors";
import type { FlaggedIngredient, ParsedIngredient } from "../types";

type Props = {
  ingredients: ParsedIngredient[];
  flagged: FlaggedIngredient[];
};

export function IngredientList({ ingredients, flagged }: Props) {
  const flaggedNames = new Set(flagged.map((item) => item.original.toLowerCase()));

  return (
    <View style={styles.wrap}>
      {ingredients.map((ingredient, index) => {
        const isFlagged = flaggedNames.has(ingredient.original.toLowerCase());
        const isAmbiguous = ingredient.match?.source_type === "ambiguous";
        const scheme = isFlagged
          ? { color: colors.red, background: colors.redSoft, icon: AlertCircle }
          : isAmbiguous
            ? { color: colors.yellow, background: colors.yellowSoft, icon: HelpCircle }
            : { color: colors.green, background: colors.greenSoft, icon: CheckCircle2 };
        const Icon = scheme.icon;

        return (
          <View key={`${ingredient.original}-${index}`} style={[styles.row, { backgroundColor: scheme.background }]}>
            <Icon color={scheme.color} size={18} />
            <View style={styles.copy}>
              <Text style={styles.name}>{ingredient.displayName}</Text>
              <Text style={styles.meta}>
                {ingredient.match?.source_type ?? "unknown"}
                {ingredient.match?.category ? ` · ${ingredient.match.category}` : ""}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8
  },
  row: {
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  copy: {
    flex: 1
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  }
});
