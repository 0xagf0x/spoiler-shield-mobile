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
import StorageService from '../services/StorageService';
import SpoilerDetector from '../services/SpoilerDetector';

const HomeScreen = () => {
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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    }
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
        <Text style={styles.cardTitle}>📊 Today's Protection</Text>
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
      </View>

      {/* Watchlist Overview */}
      <View style={styles.watchlistCard}>
        <Text style={styles.cardTitle}>🎯 Your Watchlist</Text>
        <View style={styles.watchlistRow}>
          <Text style={styles.watchlistCount}>
            {watchlistCount} {watchlistCount === 1 ? 'term' : 'terms'} protected
          </Text>
          {watchlistCount === 0 && (
            <TouchableOpacity style={styles.setupButton} onPress={setupDefaultWatchlist}>
              <Text style={styles.setupButtonText}>Setup Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="globe-outline" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Start Protected Browsing</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Add to Watchlist</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      {stats.spoilersBlocked > 0 && (
        <View style={styles.activityCard}>
          <Text style={styles.cardTitle}>🚫 Recent Blocks</Text>
          <Text style={styles.activityText}>
            Last scan: {new Date(stats.lastScanDate).toLocaleTimeString()}
          </Text>
        </View>
      )}
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
  },
  watchlistCount: {
    fontSize: 16,
    color: '#666',
  },
  setupButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  setupButtonText: {
    color: 'white',
    fontWeight: '600',
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
  activityCard: {
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
  activityText: {
    fontSize: 14,
    color: '#666',
  },
});

export default HomeScreen;