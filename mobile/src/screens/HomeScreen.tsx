import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Camera, ChevronRight, Leaf, ShieldCheck } from "lucide-react-native";
import { ActionButton } from "../components/ActionButton";
import { MacroBar } from "../components/MacroBar";
import { colors } from "../theme/colors";
import type { DailySummary, Profile, Scan } from "../types";

const biteIqLogo = require("../../assets/biteiq-logo.png");

type Props = {
  profile: Profile;
  summary: DailySummary | null;
  recentScans: Scan[];
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onScan: () => void;
  onOpenScan: (scan: Scan) => void;
};

export function HomeScreen({
  profile,
  summary,
  recentScans,
  refreshing,
  onRefresh,
  onScan,
  onOpenScan
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={biteIqLogo} style={styles.logoThumb} resizeMode="cover" />
          <View>
          <Text style={styles.eyebrow}>Today</Text>
          <Text style={styles.title}>BiteIQ</Text>
          </View>
        </View>
        <View style={styles.preferencePill}>
          <Leaf color={colors.green} size={16} />
          <Text style={styles.preferenceText}>{profile.preference}</Text>
        </View>
      </View>

      <View style={styles.scanPanel}>
        <View style={styles.scanCopy}>
          <ShieldCheck color={colors.green} size={24} strokeWidth={2.5} />
          <Text style={styles.scanTitle}>Check a label</Text>
          <Text style={styles.scanText}>Classify ingredients and update daily sugar and protein.</Text>
        </View>
        <ActionButton label="Scan" onPress={onScan} icon={<Camera color="#FFFFFF" size={20} />} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily intake</Text>
        {summary ? (
          <View style={styles.card}>
            <MacroBar label="Sugar" unitLabel="g" summary={summary.sugar} />
            <View style={styles.divider} />
            <MacroBar label="Protein" unitLabel="g" summary={summary.protein} />
            {summary.sugar.warning || summary.protein.warning ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{summary.sugar.warning || summary.protein.warning}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.muted}>Loading intake totals...</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent scans</Text>
        <View style={styles.historyStack}>
          {recentScans.slice(0, 3).map((scan) => (
            <HistoryCard key={scan.id} scan={scan} onPress={() => onOpenScan(scan)} />
          ))}
          {recentScans.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.muted}>No scans yet.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function HistoryCard({ scan, onPress }: { scan: Scan; onPress: () => void }) {
  const suitable = scan.result.preference_validation.is_suitable;
  const color =
    scan.result.classification_label === "Uncertain"
      ? colors.yellow
      : suitable
        ? colors.green
        : colors.red;
  return (
    <View style={styles.historyCard} onTouchEnd={onPress}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <View style={styles.historyCopy}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {scan.product_name}
        </Text>
        <Text style={styles.historyMeta}>
          {scan.result.classification_label} · {scan.nutrition.sugar_g}g sugar · {scan.nutrition.protein_g}g protein
        </Text>
      </View>
      <ChevronRight color={colors.muted} size={18} />
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
    gap: 24
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1
  },
  logoThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#03070D"
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  preferencePill: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.greenSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  preferenceText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900"
  },
  scanPanel: {
    borderRadius: 8,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16
  },
  scanCopy: {
    gap: 7
  },
  scanTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  scanText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 16
  },
  divider: {
    height: 1,
    backgroundColor: colors.border
  },
  warningBox: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.yellowSoft
  },
  warningText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "800"
  },
  historyStack: {
    gap: 10
  },
  historyCard: {
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  historyCopy: {
    flex: 1
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  historyMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700"
  },
  emptyCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  }
});
