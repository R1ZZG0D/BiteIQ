import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
};

export function ActionButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false
}: Props) {
  const scheme = buttonSchemes[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: scheme.background,
          borderColor: scheme.border,
          opacity: disabled ? 0.55 : pressed ? 0.82 : 1
        }
      ]}
    >
      {loading ? <ActivityIndicator color={scheme.text} /> : <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: scheme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const buttonSchemes = {
  primary: {
    background: colors.green,
    border: colors.green,
    text: "#FFFFFF"
  },
  secondary: {
    background: colors.surface,
    border: colors.border,
    text: colors.ink
  },
  danger: {
    background: colors.red,
    border: colors.red,
    text: "#FFFFFF"
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: colors.blue
  }
};

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  icon: {
    width: 20,
    alignItems: "center"
  },
  label: {
    fontSize: 16,
    fontWeight: "700"
  }
});
