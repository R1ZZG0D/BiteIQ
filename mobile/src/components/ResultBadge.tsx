import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, Leaf, XCircle } from "lucide-react-native";
import { colors } from "../theme/colors";
import type { ScanResult } from "../types";

type Props = {
  result: ScanResult;
};

export function ResultBadge({ result }: Props) {
  const scheme = getScheme(result);
  const Icon = scheme.icon;

  return (
    <View style={[styles.badge, { backgroundColor: scheme.background, borderColor: scheme.color }]}>
      <Icon color={scheme.color} size={28} strokeWidth={2.4} />
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: scheme.color }]}>{result.classification_label}</Text>
        <Text style={styles.subLabel}>{Math.round(result.confidence_score * 100)}% confidence</Text>
      </View>
    </View>
  );
}

function getScheme(result: ScanResult) {
  if (result.classification_label === "Vegan") {
    return { color: colors.green, background: colors.greenSoft, icon: Leaf };
  }
  if (result.classification_label === "Uncertain" || result.preference_validation.status === "caution") {
    return { color: colors.yellow, background: colors.yellowSoft, icon: AlertTriangle };
  }
  if (result.preference_validation.status === "not_suitable") {
    return { color: colors.red, background: colors.redSoft, icon: XCircle };
  }
  return { color: colors.blue, background: colors.blueSoft, icon: CheckCircle2 };
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  textWrap: {
    flex: 1
  },
  label: {
    fontSize: 24,
    fontWeight: "900"
  },
  subLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  }
});
