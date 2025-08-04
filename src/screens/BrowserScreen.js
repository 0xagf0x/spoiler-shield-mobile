import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProtectedRedditFeed from '../components/ProtectedRedditFeed';
import RedditAPI from '../services/RedditAPI';

const BrowserScreen = () => {
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [sortType, setSortType] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubredditPicker, setShowSubredditPicker] = useState(false);
  const [popularSubreddits, setPopularSubreddits] = useState([]);
  const [customSubreddits, setCustomSubreddits] = useState([]);

  const sortOptions = [
    { key: 'hot', label: 'Hot', icon: 'flame' },
    { key: 'new', label: 'New', icon: 'time' },
    { key: 'top', label: 'Top', icon: 'trending-up' },
    { key: 'rising', label: 'Rising', icon: 'arrow-up' },
  ];

  useEffect(() => {
    loadPopularSubreddits();
    loadCustomSubreddits();
  }, []);

  const loadPopularSubreddits = async () => {
    try {
      const subreddits = await RedditAPI.getPopularSubreddits(20);
      setPopularSubreddits(subreddits);
    } catch (error) {
      console.error('Failed to load popular subreddits:', error);
      // Use default list if API fails
      setPopularSubreddits(RedditAPI.getDefaultSubreddits());
    }
  };

  const loadCustomSubreddits = () => {
    // Load user's custom subreddits from storage
    // For now, use some defaults
    setCustomSubreddits([
      { name: 'Formula1', title: 'Formula 1' },
      { name: 'gameofthrones', title: 'Game of Thrones' },
      { name: 'MarvelStudios', title: 'Marvel Studios' },
      { name: 'StarWars', title: 'Star Wars' },
      { name: 'television', title: 'Television' },
      { name: 'movies', title: 'Movies' },
    ]);
  };

  const searchSubreddits = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a subreddit name to search');
      return;
    }

    try {
      const results = await RedditAPI.searchSubreddits(searchQuery);
      if (results.length > 0) {
        // Show search results picker
        Alert.alert(
          'Search Results',
          `Found ${results.length} subreddits. Select the first result: r/${results[0].name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Select',
              onPress: () => {
                setSelectedSubreddit(results[0].name);
                setSearchQuery('');
                setShowSubredditPicker(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('No Results', 'No subreddits found with that name');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search subreddits');
    }
  };

  const selectSubreddit = (subredditName) => {
    setSelectedSubreddit(subredditName);
    setShowSubredditPicker(false);
  };

  const renderSubredditPicker = () => {
    if (!showSubredditPicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Subreddit</Text>
            <TouchableOpacity onPress={() => setShowSubredditPicker(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search subreddits..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchSubreddits}
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchSubreddits}>
              <Ionicons name="search" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.subredditList}>
            {/* Default options */}
            <Text style={styles.sectionTitle}>Popular</Text>
            <TouchableOpacity
              style={styles.subredditItem}
              onPress={() => selectSubreddit('all')}
            >
              <Text style={styles.subredditName}>r/all</Text>
              <Text style={styles.subredditDesc}>All of Reddit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subredditItem}
              onPress={() => selectSubreddit('popular')}
            >
              <Text style={styles.subredditName}>r/popular</Text>
              <Text style={styles.subredditDesc}>Currently trending</Text>
            </TouchableOpacity>

            {/* Custom/Saved Subreddits */}
            {customSubreddits.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Subreddits</Text>
                {customSubreddits.map((sub) => (
                  <TouchableOpacity
                    key={sub.name}
                    style={styles.subredditItem}
                    onPress={() => selectSubreddit(sub.name)}
                  >
                    <Text style={styles.subredditName}>r/{sub.name}</Text>
                    <Text style={styles.subredditDesc}>{sub.title}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Popular Subreddits */}
            <Text style={styles.sectionTitle}>Discover</Text>
            {popularSubreddits.slice(0, 15).map((sub) => (
              <TouchableOpacity
                key={sub.name}
                style={styles.subredditItem}
                onPress={() => selectSubreddit(sub.name)}
              >
                <Text style={styles.subredditName}>r/{sub.name}</Text>
                <Text style={styles.subredditDesc} numberOfLines={1}>
                  {sub.description || sub.title}
                </Text>
                {sub.subscribers && (
                  <Text style={styles.subscriberCount}>
                    {(sub.subscribers / 1000000).toFixed(1)}M members
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.subredditSelector}
          onPress={() => setShowSubredditPicker(true)}
        >
          <Text style={styles.subredditText}>r/{selectedSubreddit}</Text>
          <Ionicons name="chevron-down" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <Text style={styles.protectedLabel}>🛡️ Protected</Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              sortType === option.key && styles.sortButtonActive
            ]}
            onPress={() => setSortType(option.key)}
          >
            <Ionicons 
              name={option.icon} 
              size={16} 
              color={sortType === option.key ? "white" : "#666"} 
            />
            <Text style={[
              styles.sortButtonText,
              sortType === option.key && styles.sortButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Protected Reddit Feed */}
      <ProtectedRedditFeed 
        subreddit={selectedSubreddit}
        sort={sortType}
        key={`${selectedSubreddit}-${sortType}`} // Force re-render on change
      />

      {/* Subreddit Picker Modal */}
      {renderSubredditPicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  subredditSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subredditText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  protectedLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subredditList: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  subredditItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subredditName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  subredditDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  subscriberCount: {
    fontSize: 12,
    color: '#999',
  },
});

export default BrowserScreen;