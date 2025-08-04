/**
 * Platform Manager for Spoiler Shield Mobile
 * Unified interface for all social media platforms and news sources
 */

import RedditAPI from './RedditAPI';
import TwitterAPI from './TwitterAPI';
import YouTubeAPI from './YouTubeAPI';
import NewsAPI from './NewsAPI';
import SocialMediaAPI from './SocialMediaAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PlatformManager {
  constructor() {
    this.platforms = {
      reddit: {
        api: RedditAPI,
        name: 'Reddit',
        icon: 'reddit',
        color: '#FF4500',
        enabled: false,
        configured: false
      },
      twitter: {
        api: TwitterAPI,
        name: 'Twitter/X',
        icon: 'twitter',
        color: '#1DA1F2',
        enabled: false,
        configured: false
      },
      youtube: {
        api: YouTubeAPI,
        name: 'YouTube',
        icon: 'youtube',
        color: '#FF0000',
        enabled: false,
        configured: false
      },
      news: {
        api: NewsAPI,
        name: 'Google News',
        icon: 'newspaper',
        color: '#34A853',
        enabled: true, // No API key required for basic RSS
        configured: true
      },
      facebook: {
        api: SocialMediaAPI,
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        enabled: false,
        configured: false
      },
      instagram: {
        api: SocialMediaAPI,
        name: 'Instagram',
        icon: 'instagram',
        color: '#E4405F',
        enabled: false,
        configured: false
      }
    };

    this.loadPlatformStates();
  }

  /**
   * Load platform enabled/configured states from storage
   */
  async loadPlatformStates() {
    try {
      const states = await AsyncStorage.getItem('platform_states');
      if (states) {
        const parsedStates = JSON.parse(states);
        Object.keys(parsedStates).forEach(platform => {
          if (this.platforms[platform]) {
            this.platforms[platform] = { ...this.platforms[platform], ...parsedStates[platform] };
          }
        });
      }

      // Check if APIs are actually configured
      await this.checkPlatformConfigurations();
    } catch (error) {
      console.error('[PlatformManager] Failed to load platform states:', error);
    }
  }

  /**
   * Save platform states to storage
   */
  async savePlatformStates() {
    try {
      const states = {};
      Object.keys(this.platforms).forEach(platform => {
        states[platform] = {
          enabled: this.platforms[platform].enabled,
          configured: this.platforms[platform].configured
        };
      });
      
      await AsyncStorage.setItem('platform_states', JSON.stringify(states));
    } catch (error) {
      console.error('[PlatformManager] Failed to save platform states:', error);
    }
  }

  /**
   * Check which platforms are actually configured with credentials
   */
  async checkPlatformConfigurations() {
    try {
      // Check Reddit
      const redditClientId = await AsyncStorage.getItem('reddit_client_id');
      this.platforms.reddit.configured = !!redditClientId;

      // Check Twitter
      const twitterToken = await AsyncStorage.getItem('twitter_bearer_token');
      this.platforms.twitter.configured = !!twitterToken;

      // Check YouTube
      const youtubeKey = await AsyncStorage.getItem('youtube_api_key');
      this.platforms.youtube.configured = !!youtubeKey;

      // Check Facebook
      const facebookToken = await AsyncStorage.getItem('facebook_access_token');
      this.platforms.facebook.configured = !!facebookToken;

      // Check Instagram
      const instagramToken = await AsyncStorage.getItem('instagram_access_token');
      this.platforms.instagram.configured = !!instagramToken;

      // News API doesn't require configuration for RSS feeds
      this.platforms.news.configured = true;

      await this.savePlatformStates();
    } catch (error) {
      console.error('[PlatformManager] Failed to check platform configurations:', error);
    }
  }

  /**
   * Enable/disable a platform
   */
  async setPlatformEnabled(platform, enabled) {
    if (this.platforms[platform]) {
      this.platforms[platform].enabled = enabled;
      await this.savePlatformStates();
    }
  }

  /**
   * Get all enabled platforms
   */
  getEnabledPlatforms() {
    return Object.keys(this.platforms).filter(platform => 
      this.platforms[platform].enabled && this.platforms[platform].configured
    );
  }

  /**
   * Get platform configuration status
   */
  getPlatformStatus() {
    return Object.keys(this.platforms).map(key => ({
      id: key,
      ...this.platforms[key]
    }));
  }

  /**
   * Fetch content from all enabled platforms
   */
  async fetchAllContent(options = {}) {
    const enabledPlatforms = this.getEnabledPlatforms();
    const results = {};

    const fetchPromises = enabledPlatforms.map(async (platform) => {
      try {
        let content = [];
        
        switch (platform) {
          case 'reddit':
            content = await this.fetchRedditContent(options.reddit || {});
            break;
          case 'twitter':
            content = await this.fetchTwitterContent(options.twitter || {});
            break;
          case 'youtube':
            content = await this.fetchYouTubeContent(options.youtube || {});
            break;
          case 'news':
            content = await this.fetchNewsContent(options.news || {});
            break;
          case 'facebook':
            content = await this.fetchFacebookContent(options.facebook || {});
            break;
          case 'instagram':
            content = await this.fetchInstagramContent(options.instagram || {});
            break;
        }

        results[platform] = {
          success: true,
          content,
          count: content.length
        };
      } catch (error) {
        console.error(`[PlatformManager] Failed to fetch ${platform} content:`, error);
        results[platform] = {
          success: false,
          error: error.message,
          content: [],
          count: 0
        };
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  /**
   * Fetch Reddit content
   */
  async fetchRedditContent(options) {
    const subreddit = options.subreddit || 'all';
    const sort = options.sort || 'hot';
    const limit = options.limit || 25;

    return await RedditAPI.getSubredditPosts(subreddit, { sort, limit });
  }

  /**
   * Fetch Twitter content
   */
  async fetchTwitterContent(options) {
    if (options.userId) {
      return await TwitterAPI.getUserTimeline(options.userId, options);
    } else if (options.query) {
      return await TwitterAPI.searchTweets(options.query, options);
    } else {
      // Default to searching recent tweets
      return await TwitterAPI.searchTweets('lang:en -is:retweet', options);
    }
  }

  /**
   * Fetch YouTube content
   */
  async fetchYouTubeContent(options) {
    if (options.trending) {
      return await YouTubeAPI.getTrendingVideos(options);
    } else if (options.channelId) {
      return await YouTubeAPI.getChannelVideos(options.channelId, options);
    } else if (options.query) {
      return await YouTubeAPI.searchVideos(options.query, options);
    } else {
      // Default to trending videos
      return await YouTubeAPI.getTrendingVideos(options);
    }
  }

  /**
   * Fetch News content
   */
  async fetchNewsContent(options) {
    if (options.category) {
      return await NewsAPI.getNewsByCategory(options.category, options);
    } else if (options.query) {
      return await NewsAPI.searchNews(options.query, options);
    } else {
      // Default to top headlines
      return await NewsAPI.getTopHeadlines(options);
    }
  }

  /**
   * Fetch Facebook content
   */
  async fetchFacebookContent(options) {
    if (options.pageId) {
      return await SocialMediaAPI.getFacebookPagePosts(options.pageId, options);
    } else if (options.query) {
      return await SocialMediaAPI.searchFacebookPages(options.query, options);
    } else {
      return [];
    }
  }

  /**
   * Fetch Instagram content
   */
  async fetchInstagramContent(options) {
    if (options.hashtag) {
      return await SocialMediaAPI.getInstagramHashtagMedia(options.hashtag, options);
    } else {
      return await SocialMediaAPI.getInstagramUserMedia(options);
    }
  }

  /**
   * Get unified feed from all platforms
   */
  async getUnifiedFeed(options = {}) {
    const allContent = await this.fetchAllContent(options);
    const unifiedFeed = [];

    // Combine all content and add platform metadata
    Object.keys(allContent).forEach(platform => {
      if (allContent[platform].success && allContent[platform].content) {
        allContent[platform].content.forEach(item => {
          unifiedFeed.push({
            ...item,
            platform: platform,
            platformInfo: {
              name: this.platforms[platform].name,
              icon: this.platforms[platform].icon,
              color: this.platforms[platform].color
            },
            unified: true
          });
        });
      }
    });

    // Sort by creation date (newest first)
    unifiedFeed.sort((a, b) => {
      const dateA = a.created || a.published || new Date(0);
      const dateB = b.created || b.published || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    return {
      feed: unifiedFeed,
      platformResults: allContent,
      totalItems: unifiedFeed.length
    };
  }

  /**
   * Configure platform credentials
   */
  async configurePlatform(platform, credentials) {
    switch (platform) {
      case 'reddit':
        await RedditAPI.setCredentials(credentials.clientId, credentials.clientSecret);
        break;
      case 'twitter':
        await TwitterAPI.setCredentials(credentials.bearerToken);
        break;
      case 'youtube':
        await YouTubeAPI.setCredentials(credentials.apiKey);
        break;
      case 'facebook':
        await SocialMediaAPI.setFacebookCredentials(credentials.accessToken);
        break;
      case 'instagram':
        await SocialMediaAPI.setInstagramCredentials(credentials.accessToken);
        break;
    }

    // Update configuration status
    this.platforms[platform].configured = true;
    await this.savePlatformStates();
  }

  /**
   * Test platform connection
   */
  async testPlatformConnection(platform) {
    try {
      switch (platform) {
        case 'reddit':
          return await RedditAPI.testConnection();
        case 'twitter':
          return await TwitterAPI.testConnection();
        case 'youtube':
          return await YouTubeAPI.testConnection();
        case 'news':
          return await NewsAPI.testConnection();
        case 'facebook':
          return await SocialMediaAPI.testFacebookConnection();
        case 'instagram':
          return await SocialMediaAPI.testInstagramConnection();
        default:
          return false;
      }
    } catch (error) {
      console.error(`[PlatformManager] Connection test failed for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Get all platform statistics
   */
  getAllStats() {
    return {
      reddit: RedditAPI.getStats(),
      twitter: TwitterAPI.getStats(),
      youtube: YouTubeAPI.getStats(),
      news: NewsAPI.getStats(),
      socialMedia: SocialMediaAPI.getStats()
    };
  }

  /**
   * Reset all platform statistics
   */
  resetAllStats() {
    RedditAPI.resetStats();
    TwitterAPI.resetStats();
    YouTubeAPI.resetStats();
    NewsAPI.resetStats();
    SocialMediaAPI.resetStats();
  }

  /**
   * Get platform-specific default content suggestions
   */
  getPlatformDefaults(platform) {
    switch (platform) {
      case 'reddit':
        return RedditAPI.getDefaultSubreddits();
      case 'twitter':
        return TwitterAPI.getDefaultAccounts();
      case 'youtube':
        return YouTubeAPI.getDefaultChannels();
      case 'news':
        return NewsAPI.getDefaultSources();
      case 'facebook':
        return SocialMediaAPI.getDefaultFacebookPages();
      case 'instagram':
        return SocialMediaAPI.getInstagramMediaTypes();
      default:
        return [];
    }
  }

  /**
   * Get available content categories for each platform
   */
  getPlatformCategories() {
    return {
      reddit: [
        { id: 'hot', name: 'Hot', icon: 'trending-up' },
        { id: 'new', name: 'New', icon: 'clock' },
        { id: 'top', name: 'Top', icon: 'arrow-up' },
        { id: 'rising', name: 'Rising', icon: 'arrow-up-right' }
      ],
      twitter: [
        { id: 'recent', name: 'Recent', icon: 'clock' },
        { id: 'popular', name: 'Popular', icon: 'heart' },
        { id: 'mixed', name: 'Mixed', icon: 'shuffle' }
      ],
      youtube: [
        { id: 'trending', name: 'Trending', icon: 'trending-up' },
        { id: 'recent', name: 'Recent', icon: 'clock' },
        { id: 'popular', name: 'Popular', icon: 'star' },
        { id: 'relevant', name: 'Relevant', icon: 'search' }
      ],
      news: NewsAPI.getCategories(),
      facebook: [
        { id: 'posts', name: 'Posts', icon: 'message-square' },
        { id: 'pages', name: 'Pages', icon: 'users' }
      ],
      instagram: SocialMediaAPI.getInstagramMediaTypes()
    };
  }

  /**
   * Search across all enabled platforms
   */
  async searchAllPlatforms(query, options = {}) {
    const enabledPlatforms = this.getEnabledPlatforms();
    const results = {};

    const searchPromises = enabledPlatforms.map(async (platform) => {
      try {
        let searchResults = [];
        
        switch (platform) {
          case 'reddit':
            searchResults = await RedditAPI.searchPosts(query, options);
            break;
          case 'twitter':
            searchResults = await TwitterAPI.searchTweets(query, options);
            break;
          case 'youtube':
            searchResults = await YouTubeAPI.searchVideos(query, options);
            break;
          case 'news':
            searchResults = await NewsAPI.searchNews(query, options);
            break;
          case 'facebook':
            searchResults = await SocialMediaAPI.searchFacebookPages(query, options);
            break;
        }

        results[platform] = {
          success: true,
          results: searchResults,
          count: searchResults.length
        };
      } catch (error) {
        console.error(`[PlatformManager] Search failed for ${platform}:`, error);
        results[platform] = {
          success: false,
          error: error.message,
          results: [],
          count: 0
        };
      }
    });

    await Promise.all(searchPromises);
    return results;
  }

  /**
   * Get platform health status
   */
  async getPlatformHealth() {
    const enabledPlatforms = this.getEnabledPlatforms();
    const health = {};

    for (const platform of enabledPlatforms) {
      const isConnected = await this.testPlatformConnection(platform);
      const stats = this.getAllStats()[platform] || this.getAllStats().socialMedia;
      
      health[platform] = {
        connected: isConnected,
        configured: this.platforms[platform].configured,
        enabled: this.platforms[platform].enabled,
        requestCount: stats?.requestCount || 0,
        lastRequest: stats?.lastRequestTime || null,
        status: isConnected ? 'healthy' : 'error'
      };
    }

    return health;
  }
}

// Export singleton instance
export default new PlatformManager();