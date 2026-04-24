import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Clock3 } from "lucide-react-native";
import { colors } from "../theme/colors";
import type { Scan } from "../types";

type Props = {
  scans: Scan[];
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onOpenScan: (scan: Scan) => void;
};

export function HistoryScreen({ scans, refreshing, onRefresh, onOpenScan }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{scans.length} scanned items</Text>
      </View>

      <View style={styles.list}>
        {scans.map((scan) => (
          <View key={scan.id} style={styles.card} onTouchEnd={() => onOpenScan(scan)}>
            <View style={styles.iconShell}>
              <Clock3 color={colors.blue} size={19} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.name} numberOfLines={1}>
                {scan.product_name}
              </Text>
              <Text style={styles.meta}>
                {scan.result.classification_label} · {formatDate(scan.created_at)}
              </Text>
              <Text style={styles.nutrition}>
                Sugar {scan.nutrition.sugar_g}g · Protein {scan.nutrition.protein_g}g
              </Text>
            </View>
            <ChevronRight color={colors.muted} size={18} />
          </View>
        ))}
        {scans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No scan history</Text>
            <Text style={styles.emptyText}>Scanned products will appear here.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    gap: 18
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
  list: {
    gap: 10
  },
  card: {
    minHeight: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconShell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  copy: {
    flex: 1,
    gap: 3
  },
  name: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  nutrition: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "900"
  },
  empty: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 5
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  }
});
