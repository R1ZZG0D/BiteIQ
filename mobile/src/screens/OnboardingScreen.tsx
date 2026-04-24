import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Target } from "lucide-react-native";
import { ActionButton } from "../components/ActionButton";
import { PreferenceSelector } from "../components/PreferenceSelector";
import { colors } from "../theme/colors";
import type { Preference, Profile } from "../types";

type Props = {
  initialProfile?: Profile | null;
  onComplete: (profile: {
    preference: Preference;
    sugar_goal_g: number;
    protein_goal_g: number;
  }) => Promise<void>;
};

export function OnboardingScreen({ initialProfile, onComplete }: Props) {
  const [preference, setPreference] = useState<Preference>(initialProfile?.preference ?? "Vegan");
  const [sugarGoal, setSugarGoal] = useState(String(initialProfile?.sugar_goal_g ?? 36));
  const [proteinGoal, setProteinGoal] = useState(String(initialProfile?.protein_goal_g ?? 60));
  const [saving, setSaving] = useState(false);

  const canSave = Number(sugarGoal) >= 0 && Number(proteinGoal) >= 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onComplete({
        preference,
        sugar_goal_g: Number(sugarGoal),
        protein_goal_g: Number(proteinGoal)
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.wrap}
      >
        <View style={styles.header}>
          <View style={styles.iconShell}>
            <Target color={colors.green} size={30} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>BiteIQ</Text>
          <Text style={styles.subtitle}>Set your diet profile and daily nutrition targets.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet preference</Text>
          <PreferenceSelector value={preference} onChange={setPreference} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily goals</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sugar g</Text>
              <TextInput
                keyboardType="numeric"
                value={sugarGoal}
                onChangeText={setSugarGoal}
                style={styles.input}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein g</Text>
              <TextInput
                keyboardType="numeric"
                value={proteinGoal}
                onChangeText={setProteinGoal}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <ActionButton
          label="Continue"
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
          icon={<ArrowRight color="#FFFFFF" size={20} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  wrap: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 24
  },
  header: {
    gap: 10
  },
  iconShell: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  inputRow: {
    flexDirection: "row",
    gap: 12
  },
  inputGroup: {
    flex: 1,
    gap: 8
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  }
});
