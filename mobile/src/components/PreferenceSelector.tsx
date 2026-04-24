import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { colors } from "../theme/colors";
import type { Preference } from "../types";

const preferences: Preference[] = ["Vegan", "Vegetarian", "Eggetarian", "Non-Vegetarian"];

type Props = {
  value: Preference;
  onChange: (preference: Preference) => void;
};

export function PreferenceSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {preferences.map((preference) => {
        const active = value === preference;
        return (
          <Pressable
            accessibilityRole="button"
            key={preference}
            onPress={() => onChange(preference)}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{preference}</Text>
            {active ? <Check color={colors.green} size={18} strokeWidth={2.5} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10
  },
  option: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  optionActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green
  },
  optionText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  optionTextActive: {
    color: colors.green
  }
});
