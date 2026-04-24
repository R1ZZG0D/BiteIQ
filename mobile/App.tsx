import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api } from "./src/api/client";
import { BottomTabs, type MainTab } from "./src/components/BottomTabs";
import { CameraScreen } from "./src/screens/CameraScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { colors } from "./src/theme/colors";
import type { DailySummary, Preference, Profile, Scan } from "./src/types";

const onboardingKey = "food-intelligence:onboarded";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bootError, setBootError] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setBootError("");
    try {
      const [nextProfile, nextSummary, nextHistory] = await Promise.all([
        api.getProfile(),
        api.getSummary(),
        api.getHistory()
      ]);
      setProfile(nextProfile);
      setSummary(nextSummary);
      setHistory(nextHistory);
    } catch (error) {
      setBootError(error instanceof Error ? error.message : "Unable to reach the API.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function boot() {
      const stored = await AsyncStorage.getItem(onboardingKey);
      setOnboarded(stored === "true");
      await refresh();
    }
    void boot();
  }, [refresh]);

  async function saveProfile(input: {
    preference: Preference;
    sugar_goal_g: number;
    protein_goal_g: number;
  }) {
    const nextProfile = await api.updateProfile(input);
    setProfile(nextProfile);
    await refresh();
  }

  async function completeOnboarding(input: {
    preference: Preference;
    sugar_goal_g: number;
    protein_goal_g: number;
  }) {
    await saveProfile(input);
    await AsyncStorage.setItem(onboardingKey, "true");
    setOnboarded(true);
  }

  async function handleScanComplete(scan: Scan) {
    setSelectedScan(scan);
    await refresh();
  }

  function renderTab() {
    if (!profile) return null;
    if (selectedScan) {
      return (
        <ResultScreen
          scan={selectedScan}
          onDone={() => {
            setSelectedScan(null);
            setActiveTab("home");
          }}
          onScanAnother={() => {
            setSelectedScan(null);
            setActiveTab("scan");
          }}
        />
      );
    }

    if (activeTab === "scan") {
      return <CameraScreen onScanComplete={handleScanComplete} />;
    }
    if (activeTab === "history") {
      return (
        <HistoryScreen
          scans={history}
          refreshing={refreshing}
          onRefresh={refresh}
          onOpenScan={setSelectedScan}
        />
      );
    }
    if (activeTab === "profile") {
      return <ProfileScreen profile={profile} onSave={saveProfile} />;
    }
    return (
      <HomeScreen
        profile={profile}
        summary={summary}
        recentScans={history}
        refreshing={refreshing}
        onRefresh={refresh}
        onScan={() => setActiveTab("scan")}
        onOpenScan={setSelectedScan}
      />
    );
  }

  if (onboarded === null || !profile) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingScreen}>
          <StatusBar style="dark" />
          <ActivityIndicator color={colors.green} size="large" />
          {bootError ? <Text style={styles.errorText}>{bootError}</Text> : null}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen initialProfile={profile} onComplete={completeOnboarding} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={styles.appShell}>
          {bootError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{bootError}</Text>
            </View>
          ) : null}
          <View style={styles.screen}>{renderTab()}</View>
          {!selectedScan ? <BottomTabs activeTab={activeTab} onChange={setActiveTab} /> : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background
  },
  screen: {
    flex: 1
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 20
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "800"
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.redSoft
  },
  bannerText: {
    color: colors.red,
    fontWeight: "800"
  }
});
