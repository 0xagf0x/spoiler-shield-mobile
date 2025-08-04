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
import PlatformManager from "../services/PlatformManager";
import { BrandColors } from "../constants/Colors";

const SettingsScreen = ({ navigation }) => {
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
  const [platformStats, setPlatformStats] = useState({});

  useEffect(() => {
    loadSettings();
    loadStats();
    loadPlatformStats();
  }, []);

  const loadSettings = async () => {
    // Settings will be expanded later
    // For now, using default values
  };

  const loadStats = async () => {
    const currentStats = await StorageService.getStats();
    setStats(currentStats);
  };

  const loadPlatformStats = async () => {
    try {
      const allStats = PlatformManager.getAllStats();
      setPlatformStats(allStats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
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
            // Reset platform stats
            PlatformManager.resetAllStats();
            await loadStats();
            await loadPlatformStats();
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
            PlatformManager.resetAllStats();
            await loadStats();
            await loadPlatformStats();
            Alert.alert("Success", "Statistics have been reset");
          },
        },
      ]
    );
  };

  const SettingRow = ({ title, subtitle, icon, onPress, hasSwitch, switchValue, onSwitchToggle }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={hasSwitch}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={BrandColors.primary} style={styles.settingIcon} />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchToggle}
          trackColor={{ false: "#767577", true: BrandColors.primary }}
          thumbColor={switchValue ? "#fff" : "#f4f3f4"}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Statistics Section */}
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
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Object.values(platformStats).reduce((total, stat) => 
                total + (stat.requestCount || 0), 0
              )}
            </Text>
            <Text style={styles.statLabel}>API Requests</Text>
          </View>
        </View>
      </View>

      {/* Platform Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platforms</Text>
        
        <SettingRow
          title="Platform Settings"
          subtitle="Configure Twitter, YouTube, Facebook, Instagram & News"
          icon="apps-outline"
          onPress={() => navigation.navigate("PlatformSettings")}
        />

        <SettingRow
          title="Test All Platforms"
          subtitle="Check connection status for all configured platforms"
          icon="wifi-outline"
          onPress={async () => {
            Alert.alert("Testing...", "Checking platform connections...");
            try {
              const health = await PlatformManager.getPlatformHealth();
              const results = Object.entries(health)
                .map(([platform, status]) => 
                  `${platform}: ${status.connected ? '✅' : '❌'}`
                )
                .join('\n');
              
              Alert.alert("Platform Status", results || "No platforms configured");
            } catch (error) {
              Alert.alert("Error", "Failed to test platform connections");
            }
          }}
        />
      </View>

      {/* Protection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection</Text>

        <SettingRow
          title="Auto-Block Spoilers"
          subtitle="Automatically blur detected spoilers"
          icon="shield-checkmark-outline"
          hasSwitch={true}
          switchValue={settings.autoBlock}
          onSwitchToggle={() => toggleSetting("autoBlock")}
        />

        <SettingRow
          title="Show Confidence Score"
          subtitle="Display detection confidence levels"
          icon="analytics-outline"
          hasSwitch={true}
          switchValue={settings.showConfidence}
          onSwitchToggle={() => toggleSetting("showConfidence")}
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <SettingRow
          title="Export Watchlist"
          subtitle="Save your spoiler terms"
          icon="download-outline"
          onPress={exportWatchlist}
        />

        <SettingRow
          title="Reset Statistics"
          subtitle="Clear all usage statistics"
          icon="refresh-outline"
          onPress={resetStats}
        />

        <SettingRow
          title="Clear All Data"
          subtitle="Remove all data and reset app"
          icon="trash-outline"
          onPress={clearAllData}
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

        <SettingRow
          title="Test Unified Feed"
          subtitle="Fetch content from all enabled platforms"
          icon="layers-outline"
          onPress={async () => {
            Alert.alert("Loading...", "Fetching unified feed...");
            try {
              const result = await PlatformManager.getUnifiedFeed({
                limit: 5
              });
              
              const summary = `Fetched ${result.totalItems} items from ${
                Object.keys(result.platformResults).length
              } platforms:\n\n${
                Object.entries(result.platformResults)
                  .map(([platform, data]) => 
                    `${platform}: ${data.success ? data.count + ' items' : 'failed'}`
                  )
                  .join('\n')
              }`;
              
              Alert.alert("Unified Feed Test", summary);
            } catch (error) {
              Alert.alert("Error", `Failed to fetch unified feed: ${error.message}`);
            }
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