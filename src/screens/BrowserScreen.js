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
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProtectedRedditFeed from '../components/ProtectedRedditFeed';
import RedditAPI from '../services/RedditAPI';
import PlatformManager from '../services/PlatformManager';
import { BrandColors } from '../constants/Colors';

const BrowserScreen = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('reddit');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [sortType, setSortType] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showSubredditPicker, setShowSubredditPicker] = useState(false);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [popularSubreddits, setPopularSubreddits] = useState([]);
  const [customSubreddits, setCustomSubreddits] = useState([]);
  const [unifiedFeed, setUnifiedFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platformOptions, setPlatformOptions] = useState({});

  const sortOptions = [
    { key: 'hot', label: 'Hot', icon: 'flame' },
    { key: 'new', label: 'New', icon: 'time' },
    { key: 'top', label: 'Top', icon: 'trending-up' },
    { key: 'rising', label: 'Rising', icon: 'arrow-up' },
  ];

  useEffect(() => {
    loadAvailablePlatforms();
    loadPopularSubreddits();
    loadCustomSubreddits();
  }, []);

  const loadAvailablePlatforms = async () => {
    try {
      const enabledPlatforms = PlatformManager.getEnabledPlatforms();
      const platformStatus = PlatformManager.getPlatformStatus();
      
      // Always include Reddit as it's the default
      const allPlatforms = [
        { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', enabled: true },
        ...platformStatus.filter(p => p.enabled && p.configured && p.id !== 'reddit')
      ];
      
      setAvailablePlatforms(allPlatforms);
      
      // If current platform is not available, switch to Reddit
      if (!allPlatforms.find(p => p.id === selectedPlatform)) {
        setSelectedPlatform('reddit');
      }
    } catch (error) {
      console.error('Failed to load available platforms:', error);
    }
  };

  const loadPopularSubreddits = async () => {
    try {
      const subreddits = await RedditAPI.getPopularSubreddits(20);
      setPopularSubreddits(subreddits);
    } catch (error) {
      console.error('Failed to load popular subreddits:', error);
      setPopularSubreddits(RedditAPI.getDefaultSubreddits());
    }
  };

  const loadCustomSubreddits = () => {
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
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    if (selectedPlatform === 'reddit') {
      try {
        const results = await RedditAPI.searchSubreddits(searchQuery);
        if (results.length > 0) {
          Alert.alert(
            'Search Results',
            `Found ${results.length} subreddits matching "${searchQuery}"`
          );
        } else {
          Alert.alert('No Results', `No subreddits found for "${searchQuery}"`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to search subreddits');
      }
    } else {
      // Search across all platforms
      await searchAllPlatforms();
    }
  };

  const searchAllPlatforms = async () => {
    setLoading(true);
    try {
      const results = await PlatformManager.searchAllPlatforms(searchQuery, {
        limit: 10
      });
      
      let totalResults = 0;
      let platformSummary = '';
      
      Object.entries(results).forEach(([platform, data]) => {
        if (data.success && data.count > 0) {
          totalResults += data.count;
          platformSummary += `${platform}: ${data.count} results\n`;
        }
      });
      
      if (totalResults > 0) {
        Alert.alert(
          'Search Results',
          `Found ${totalResults} results across platforms:\n\n${platformSummary}`
        );
      } else {
        Alert.alert('No Results', `No results found for "${searchQuery}"`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search platforms');
    } finally {
      setLoading(false);
    }
  };

  const loadUnifiedFeed = async () => {
    setLoading(true);
    try {
      const options = {
        reddit: { subreddit: selectedSubreddit, sort: sortType, limit: 15 },
        twitter: { query: 'trending', limit: 10 },
        youtube: { trending: true, limit: 10 },
        news: { category: 'general', limit: 15 }
      };
      
      const result = await PlatformManager.getUnifiedFeed(options);
      setUnifiedFeed(result.feed);
    } catch (error) {
      console.error('Failed to load unified feed:', error);
      Alert.alert('Error', 'Failed to load unified feed');
    } finally {
      setLoading(false);
    }
  };

  const renderPlatformPicker = () => (
    <Modal
      visible={showPlatformPicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPlatformPicker(false)}>
            <Ionicons name="close" size={24} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Platform</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {availablePlatforms.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformOption,
                selectedPlatform === platform.id && styles.platformOptionSelected
              ]}
              onPress={() => {
                setSelectedPlatform(platform.id);
                setShowPlatformPicker(false);
              }}
            >
              <Ionicons 
                name={platform.icon} 
                size={24} 
                color={selectedPlatform === platform.id ? BrandColors.primary : BrandColors.textSecondary} 
              />
              <Text style={[
                styles.platformOptionText,
                selectedPlatform === platform.id && styles.platformOptionTextSelected
              ]}>
                {platform.name}
              </Text>
              {selectedPlatform === platform.id && (
                <Ionicons name="checkmark" size={20} color={BrandColors.primary} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.platformOption}
            onPress={() => {
              setSelectedPlatform('unified');
              setShowPlatformPicker(false);
            }}
          >
            <Ionicons name="layers" size={24} color={BrandColors.primary} />
            <Text style={styles.platformOptionText}>Unified Feed (All Platforms)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderContent = () => {
    if (selectedPlatform === 'reddit') {
      return (
        <ProtectedRedditFeed 
          subreddit={selectedSubreddit} 
          sort={sortType} 
        />
      );
    } else if (selectedPlatform === 'unified') {
      return (
        <View style={styles.unifiedFeedContainer}>
          <TouchableOpacity 
            style={styles.loadFeedButton}
            onPress={loadUnifiedFeed}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.loadFeedButtonText}>Load Unified Feed</Text>
              </>
            )}
          </TouchableOpacity>
          
          {unifiedFeed.length > 0 && (
            <FlatList
              data={unifiedFeed}
              keyExtractor={(item, index) => `${item.platform}-${item.id}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.unifiedFeedItem}>
                  <View style={styles.feedItemHeader}>
                    <Ionicons 
                      name={item.platformInfo.icon} 
                      size={16} 
                      color={item.platformInfo.color} 
                    />
                    <Text style={styles.feedItemPlatform}>{item.platformInfo.name}</Text>
                    <Text style={styles.feedItemTime}>
                      {new Date(item.created || item.published).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.feedItemTitle} numberOfLines={2}>
                    {item.title || item.text || item.message || 'No title'}
                  </Text>
                  <Text style={styles.feedItemDescription} numberOfLines={3}>
                    {item.description || item.selfText || item.caption || ''}
                  </Text>
                </View>
              )}
              refreshing={loading}
              onRefresh={loadUnifiedFeed}
            />
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.platformNotSupported}>
          <Ionicons name="construct" size={48} color={BrandColors.textSecondary} />
          <Text style={styles.platformNotSupportedText}>
            {selectedPlatform} feed coming soon!
          </Text>
          <Text style={styles.platformNotSupportedSubtext}>
            This platform is configured but the feed view is not yet implemented.
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Platform Selector */}
          <TouchableOpacity
            style={styles.platformSelector}
            onPress={() => setShowPlatformPicker(true)}
          >
            <Ionicons 
              name={availablePlatforms.find(p => p.id === selectedPlatform)?.icon || 'layers'} 
              size={20} 
              color={BrandColors.primary} 
            />
            <Text style={styles.platformSelectorText}>
              {selectedPlatform === 'unified' 
                ? 'Unified Feed' 
                : availablePlatforms.find(p => p.id === selectedPlatform)?.name || 'Select Platform'
              }
            </Text>
            <Ionicons name="chevron-down" size={16} color={BrandColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Reddit-specific controls */}
        {selectedPlatform === 'reddit' && (
          <>
            <View style={styles.headerRow}>
              {/* Subreddit Selector */}
              <TouchableOpacity
                style={styles.subredditSelector}
                onPress={() => setShowSubredditPicker(true)}
              >
                <Text style={styles.subredditText}>r/{selectedSubreddit}</Text>
                <Ionicons name="chevron-down" size={16} color={BrandColors.textSecondary} />
              </TouchableOpacity>

              {/* Sort Options */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      sortType === option.key && styles.sortOptionActive,
                    ]}
                    onPress={() => setSortType(option.key)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={sortType === option.key ? '#fff' : BrandColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortType === option.key && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={BrandColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              selectedPlatform === 'reddit' 
                ? "Search subreddits..." 
                : "Search all platforms..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchSubreddits}
          />
          {loading && <ActivityIndicator size="small" color={BrandColors.primary} />}
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Platform Picker Modal */}
      {renderPlatformPicker()}

      {/* Subreddit Picker Modal - Only for Reddit */}
      {selectedPlatform === 'reddit' && (
        <Modal
          visible={showSubredditPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSubredditPicker(false)}>
                <Ionicons name="close" size={24} color={BrandColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Subreddit</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Popular Subreddits */}
              <Text style={styles.subredditGroupTitle}>Popular</Text>
              {popularSubreddits.map((subreddit) => (
                <TouchableOpacity
                  key={subreddit.name}
                  style={[
                    styles.subredditOption,
                    selectedSubreddit === subreddit.name && styles.subredditOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSubreddit(subreddit.name);
                    setShowSubredditPicker(false);
                  }}
                >
                  <Text style={styles.subredditName}>r/{subreddit.name}</Text>
                  <Text style={styles.subredditDescription}>{subreddit.description}</Text>
                  {selectedSubreddit === subreddit.name && (
                    <Ionicons name="checkmark" size={20} color={BrandColors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Custom Subreddits */}
              <Text style={styles.subredditGroupTitle}>Custom</Text>
              {customSubreddits.map((subreddit) => (
                <TouchableOpacity
                  key={subreddit.name}
                  style={[
                    styles.subredditOption,
                    selectedSubreddit === subreddit.name && styles.subredditOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSubreddit(subreddit.name);
                    setShowSubredditPicker(false);
                  }}
                >
                  <Text style={styles.subredditName}>r/{subreddit.name}</Text>
                  <Text style={styles.subredditDescription}>{subreddit.title}</Text>
                  {selectedSubreddit === subreddit.name && (
                    <Ionicons name="checkmark" size={20} color={BrandColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    backgroundColor: BrandColors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flex: 1,
  },
  platformSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.textPrimary,
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  subredditSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginRight: 12,
  },
  subredditText: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.textPrimary,
    marginRight: 8,
  },
  sortContainer: {
    flex: 1,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.background,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  sortOptionActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    marginLeft: 4,
    color: BrandColors.textSecondary,
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: BrandColors.textPrimary,
  },
  unifiedFeedContainer: {
    flex: 1,
    padding: 16,
  },
  loadFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  loadFeedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  unifiedFeedItem: {
    backgroundColor: BrandColors.cardBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  feedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedItemPlatform: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandColors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  feedItemTime: {
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  feedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  feedItemDescription: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    lineHeight: 20,
  },
  platformNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  platformNotSupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  platformNotSupportedSubtext: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: BrandColors.cardBackground,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  platformOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '10',
  },
  platformOptionText: {
    fontSize: 16,
    color: BrandColors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  platformOptionTextSelected: {
    color: BrandColors.primary,
    fontWeight: '600',
  },
  subredditGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  subredditOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: BrandColors.cardBackground,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  subredditOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '10',
  },
  subredditName: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.textPrimary,
  },
  subredditDescription: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
});

export default BrowserScreen;