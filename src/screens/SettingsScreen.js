import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StorageService from "../services/StorageService";
import SpoilerDetector from "../services/SpoilerDetector";
import { BrandColors } from "../constants/Colors";

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    protectionEnabled: true,
    sensitivityLevel: "medium",
    showConfidence: true,
    autoBlock: true,
  });
  const [stats, setStats] = useState({
    spoilersBlocked: 0,
    postsScanned: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    // Settings will be expanded later
    // For now, using default values
  };

  const loadStats = async () => {
    const currentStats = await StorageService.getStats();
    setStats(currentStats);
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will remove your watchlist, settings, and statistics. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await StorageService.saveWatchlist([]);
            await StorageService.updateStats({
              spoilersBlocked: -stats.spoilersBlocked,
              postsScanned: -stats.postsScanned,
            });
            await loadStats();
            Alert.alert("Success", "All data has been cleared");
          },
        },
      ]
    );
  };

  const exportWatchlist = async () => {
    const watchlist = await StorageService.getWatchlist();
    const exportText = watchlist.join("\n");

    Alert.alert("Export Watchlist", `Your watchlist:\n\n${exportText}`, [
      { text: "Close" },
      {
        text: "Copy",
        onPress: () => {
          // In a real app, you'd use Clipboard API
          Alert.alert(
            "Note",
            "Copy functionality would be implemented with @react-native-clipboard/clipboard"
          );
        },
      },
    ]);
  };

  const resetStats = () => {
    Alert.alert(
      "Reset Statistics",
      "This will reset all your protection statistics to zero.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await StorageService.updateStats({
              spoilersBlocked: -stats.spoilersBlocked,
              postsScanned: -stats.postsScanned,
            });
            await loadStats();
            Alert.alert("Success", "Statistics have been reset");
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      "About Spoiler Shield",
      "Spoiler Shield protects you from unwanted spoilers by scanning content for terms in your watchlist.\n\nVersion: 1.0.0\nBuilt with React Native\n\nYour privacy is protected - all analysis happens on your device.",
      [{ text: "OK" }]
    );
  };

  const SettingRow = ({ title, subtitle, onPress, rightComponent, icon }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        {icon && (
          <Ionicons
            name={icon}
            size={24}
            color="#007AFF"
            style={styles.settingIcon}
          />
        )}
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Protection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Settings</Text>

        <SettingRow
          title="Spoiler Protection"
          subtitle={settings.protectionEnabled ? "Active" : "Disabled"}
          icon="shield-outline"
          rightComponent={
            <Switch
              value={settings.protectionEnabled}
              onValueChange={() => toggleSetting("protectionEnabled")}
            />
          }
        />

        <SettingRow
          title="Show Confidence Levels"
          subtitle="Display detection confidence percentages"
          icon="analytics-outline"
          rightComponent={
            <Switch
              value={settings.showConfidence}
              onValueChange={() => toggleSetting("showConfidence")}
            />
          }
        />

        <SettingRow
          title="Auto-block High Confidence"
          subtitle="Automatically hide content with >90% confidence"
          icon="flash-outline"
          rightComponent={
            <Switch
              value={settings.autoBlock}
              onValueChange={() => toggleSetting("autoBlock")}
            />
          }
        />
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.spoilersBlocked}</Text>
            <Text style={styles.statLabel}>Spoilers Blocked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.postsScanned}</Text>
            <Text style={styles.statLabel}>Posts Scanned</Text>
          </View>
        </View>

        <SettingRow
          title="Reset Statistics"
          subtitle="Clear all protection statistics"
          icon="refresh-outline"
          onPress={resetStats}
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <SettingRow
          title="Export Watchlist"
          subtitle="View and copy your watchlist terms"
          icon="download-outline"
          onPress={exportWatchlist}
        />

        <SettingRow
          title="Clear All Data"
          subtitle="Remove watchlist, settings, and statistics"
          icon="trash-outline"
          onPress={clearAllData}
        />
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingRow
          title="About Spoiler Shield"
          subtitle="Version 1.0.0 - Privacy-first spoiler protection"
          icon="information-circle-outline"
          onPress={showAbout}
        />

        <SettingRow
          title="Privacy Policy"
          subtitle="All data stays on your device"
          icon="lock-closed-outline"
          onPress={() =>
            Alert.alert(
              "Privacy Policy",
              "Spoiler Shield processes all content locally on your device. No data is sent to external servers. Your watchlist and browsing activity remain completely private.",
              [{ text: "OK" }]
            )
          }
        />

        <SettingRow
          title="How It Works"
          subtitle="Learn about spoiler detection technology"
          icon="help-circle-outline"
          onPress={() =>
            Alert.alert(
              "How Spoiler Shield Works",
              "1. You add terms to your watchlist\n2. Content is scanned for these terms\n3. Potential spoilers are detected using pattern matching\n4. You choose whether to view or hide the content\n\nAll processing happens on your device for maximum privacy.",
              [{ text: "Got it!" }]
            )
          }
        />
      </View>

      {/* Developer Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>

        <SettingRow
          title="Test Detection Engine"
          subtitle="Run detection tests with sample content"
          icon="code-outline"
          onPress={async () => {
            const testResults = await SpoilerDetector.analyzeText(
              "Formula 1 race results: Hamilton wins! Marvel's new movie spoiler: Iron Man returns!"
            );
            Alert.alert(
              "Detection Test Results",
              `Spoiler detected: ${
                testResults.hasSpoiler
              }\nConfidence: ${Math.round(
                testResults.confidence * 100
              )}%\nMatched terms: ${testResults.matchedTerms.join(", ")}`,
              [{ text: "OK" }]
            );
          }}
        />

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Spoiler Shield v1.0.0</Text>
          <Text style={styles.versionSubtext}>
            Built with React Native & Expo
          </Text>
          <Text style={styles.versionSubtext}>
            Privacy-first spoiler protection
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  section: {
    backgroundColor: BrandColors.cardBackground,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: BrandColors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: BrandColors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: BrandColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: 4,
  },
  versionInfo: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: "600",
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginBottom: 2,
  },
});

export default SettingsScreen;
