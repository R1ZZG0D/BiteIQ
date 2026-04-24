import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Save } from "lucide-react-native";
import { ActionButton } from "../components/ActionButton";
import { PreferenceSelector } from "../components/PreferenceSelector";
import { colors } from "../theme/colors";
import type { Preference, Profile } from "../types";

type Props = {
  profile: Profile;
  onSave: (profile: {
    preference: Preference;
    sugar_goal_g: number;
    protein_goal_g: number;
  }) => Promise<void>;
};

export function ProfileScreen({ profile, onSave }: Props) {
  const [preference, setPreference] = useState<Preference>(profile.preference);
  const [sugarGoal, setSugarGoal] = useState(String(profile.sugar_goal_g));
  const [proteinGoal, setProteinGoal] = useState(String(profile.protein_goal_g));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        preference,
        sugar_goal_g: Number(sugarGoal),
        protein_goal_g: Number(proteinGoal)
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Diet preference and daily targets</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet preference</Text>
          <PreferenceSelector value={preference} onChange={setPreference} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily goals</Text>
          <View style={styles.row}>
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
          label="Save"
          onPress={handleSave}
          loading={saving}
          icon={<Save color="#FFFFFF" size={18} />}
        />

        {saved ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedText}>Profile updated.</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    gap: 20
  },
  header: {
    gap: 4
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  row: {
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
  },
  savedBox: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.greenSoft
  },
  savedText: {
    color: colors.green,
    fontWeight: "900"
  }
});
