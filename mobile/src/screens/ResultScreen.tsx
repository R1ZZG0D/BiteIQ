import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RotateCcw, X } from "lucide-react-native";
import { ActionButton } from "../components/ActionButton";
import { IngredientList } from "../components/IngredientList";
import { ResultBadge } from "../components/ResultBadge";
import { colors } from "../theme/colors";
import type { Scan } from "../types";

type Props = {
  scan: Scan;
  onDone: () => void;
  onScanAnother: () => void;
};

export function ResultScreen({ scan, onDone, onScanAnother }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Result</Text>
          <Text style={styles.title} numberOfLines={2}>
            {scan.product_name}
          </Text>
        </View>
        <ActionButton label="Close" onPress={onDone} variant="ghost" icon={<X color={colors.blue} size={18} />} />
      </View>

      <ResultBadge result={scan.result} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Explanation</Text>
        <Text style={styles.bodyText}>{scan.result.explanation}</Text>
        <View style={styles.validationBox}>
          <Text style={styles.validationText}>{scan.result.preference_validation.message}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition estimate</Text>
        <View style={styles.nutritionGrid}>
          <NutritionTile label="Sugar" value={`${scan.nutrition.sugar_g}g`} />
          <NutritionTile label="Protein" value={`${scan.nutrition.protein_g}g`} />
        </View>
        <Text style={styles.note}>{scan.nutrition.notes}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredients</Text>
        {scan.parsed.ingredients.length > 0 ? (
          <IngredientList
            ingredients={scan.parsed.ingredients}
            flagged={scan.result.flagged_ingredients}
          />
        ) : (
          <Text style={styles.bodyText}>No ingredient list was detected.</Text>
        )}
      </View>

      {scan.result.alternatives.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alternatives</Text>
          {scan.result.alternatives.map((alternative) => (
            <Text key={alternative} style={styles.bodyText}>
              {alternative}
            </Text>
          ))}
        </View>
      ) : null}

      <ActionButton
        label="Scan another"
        onPress={onScanAnother}
        icon={<RotateCcw color="#FFFFFF" size={18} />}
      />
    </ScrollView>
  );
}

function NutritionTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    gap: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "900",
    maxWidth: 260
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  validationBox: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surfaceAlt
  },
  validationText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 10
  },
  tile: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surfaceAlt
  },
  tileLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  tileValue: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700"
  }
});
