import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import type { MacroSummary } from "../types";

type Props = {
  label: string;
  unitLabel: string;
  summary: MacroSummary;
};

export function MacroBar({ label, unitLabel, summary }: Props) {
  const statusColor =
    summary.status === "exceeded"
      ? colors.red
      : summary.status === "near_limit"
        ? colors.yellow
        : colors.green;
  const progress = Math.min(100, summary.percent_used);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {summary.consumed_g} / {summary.goal_g}
          {unitLabel}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: statusColor }]} />
      </View>
      <Text style={[styles.percent, { color: statusColor }]}>{summary.percent_used}% used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  value: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.border
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  percent: {
    fontSize: 12,
    fontWeight: "800"
  }
});
