import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import StorageService from '../services/StorageService';
import SpoilerDetector from '../services/SpoilerDetector';

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    spoilersBlocked: 0,
    postsScanned: 0,
    lastScanDate: new Date().toISOString()
  });
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [currentStats, watchlist] = await Promise.all([
      StorageService.getStats(),
      StorageService.getWatchlist()
    ]);
    
    setStats(currentStats);
    setWatchlistCount(watchlist.length);
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const toggleProtection = () => {
    setIsEnabled(!isEnabled);
    Alert.alert(
      'Protection ' + (isEnabled ? 'Disabled' : 'Enabled'),
      isEnabled 
        ? 'Spoiler protection is now OFF' 
        : 'Spoiler protection is now ON'
    );
  };

  const setupDefaultWatchlist = async () => {
    const defaultTerms = SpoilerDetector.getDefaultWatchlist();
    const currentWatchlist = await StorageService.getWatchlist();
    
    if (currentWatchlist.length === 0) {
      Alert.alert(
        'Setup Watchlist',
        'Would you like to add some popular spoiler terms to get started?',
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: 'Add Defaults',
            onPress: async () => {
              for (const term of defaultTerms) {
                await StorageService.addToWatchlist(term);
              }
              await loadData();
              Alert.alert('Success!', `Added ${defaultTerms.length} terms to your watchlist`);
            }
          }
        ]
      );
    } else {
      // Navigate to watchlist if already has terms
      navigation.navigate('Watchlist');
    }
  };

  const testSpoilerDetection = async () => {
    const testTexts = [
      "Can't believe Hamilton won the F1 race today!",
      "Just finished watching the latest Marvel movie",
      "The weather is nice today",
      "House of the Dragon finale was amazing!"
    ];
    
    let results = [];
    for (const text of testTexts) {
      const result = await SpoilerDetector.analyzeText(text);
      results.push({ text, result });
    }
    
    const spoilerCount = results.filter(r => r.result.hasSpoiler).length;
    Alert.alert(
      'Detection Test',
      `Tested 4 phrases:\n• ${spoilerCount} contained spoilers\n• ${4 - spoilerCount} were clean\n\nCheck your stats!`
    );
    
    await loadData(); // Refresh stats
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Protection Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={isEnabled ? "shield-checkmark" : "shield-outline"} 
            size={32} 
            color={isEnabled ? "#4CAF50" : "#FF5722"} 
          />
          <Text style={[styles.statusText, { color: isEnabled ? "#4CAF50" : "#FF5722" }]}>
            Protection {isEnabled ? "Active" : "Inactive"}
          </Text>
        </View>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleProtection}>
          <Text style={styles.toggleButtonText}>
            {isEnabled ? "Disable" : "Enable"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>📊 Protection Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.spoilersBlocked}</Text>
            <Text style={styles.statLabel}>Spoilers Blocked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.postsScanned}</Text>
            <Text style={styles.statLabel}>Posts Scanned</Text>
          </View>
        </View>
        {stats.postsScanned > 0 && (
          <Text style={styles.lastScanText}>
            Last scan: {new Date(stats.lastScanDate).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Watchlist Overview */}
      <View style={styles.watchlistCard}>
        <Text style={styles.cardTitle}>🎯 Your Watchlist</Text>
        <View style={styles.watchlistRow}>
          <Text style={styles.watchlistCount}>
            {watchlistCount} {watchlistCount === 1 ? 'term' : 'terms'} protected
          </Text>
          <TouchableOpacity 
            style={styles.manageButton} 
            onPress={() => navigation.navigate('Watchlist')}
          >
            <Text style={styles.manageButtonText}>
              {watchlistCount === 0 ? 'Setup' : 'Manage'}
            </Text>
          </TouchableOpacity>
        </View>
        {watchlistCount === 0 && (
          <TouchableOpacity style={styles.setupButton} onPress={setupDefaultWatchlist}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.setupButtonText}>Add Popular Terms</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Browser')}
        >
          <Ionicons name="globe-outline" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Protected Browsing</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Watchlist')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Manage Watchlist</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={testSpoilerDetection}
        >
          <Ionicons name="flash-outline" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>Test Detection</Text>
          <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Status Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          Spoiler Shield scans content for terms in your watchlist and blocks potential spoilers before you see them. 
          Add terms for shows, sports, or anything you want to avoid spoilers for.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lastScanText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  watchlistCard: {
    backgroundColor: 'white',
    margin: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  watchlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchlistCount: {
    fontSize: 16,
    color: '#666',
  },
  manageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  setupButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;