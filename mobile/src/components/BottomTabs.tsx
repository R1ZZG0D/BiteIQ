import { Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, History, Home, User } from "lucide-react-native";
import { colors } from "../theme/colors";

export type MainTab = "home" | "scan" | "history" | "profile";

type Props = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
};

const tabs = [
  { key: "home", label: "Home", icon: Home },
  { key: "scan", label: "Scan", icon: Camera },
  { key: "history", label: "History", icon: History },
  { key: "profile", label: "Profile", icon: User }
] satisfies { key: MainTab; label: string; icon: typeof Home }[];

export function BottomTabs({ activeTab, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <Pressable
            accessibilityRole="tab"
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Icon color={active ? colors.green : colors.muted} size={20} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 70,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  tabActive: {
    backgroundColor: colors.greenSoft
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  labelActive: {
    color: colors.green
  }
});
