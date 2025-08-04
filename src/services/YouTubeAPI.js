/**
 * YouTube Data API Service for Spoiler Shield Mobile
 * Handles YouTube API v3 integration for video content protection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class YouTubeAPI {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.apiKey = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 100; // 100ms between requests (YouTube has generous limits)
    
    this.loadCredentials();
  }

  /**
   * Load YouTube API credentials from storage
   */
  async loadCredentials() {
    try {
      const apiKey = await AsyncStorage.getItem('youtube_api_key');
      if (apiKey) {
        this.apiKey = apiKey;
      }
    } catch (error) {
      console.error('[YouTubeAPI] Failed to load credentials:', error);
    }
  }

  /**
   * Set YouTube API credentials
   */
  async setCredentials(apiKey) {
    try {
      this.apiKey = apiKey;
      await AsyncStorage.setItem('youtube_api_key', apiKey);
    } catch (error) {
      console.error('[YouTubeAPI] Failed to save credentials:', error);
      throw new Error('Failed to save YouTube credentials');
    }
  }

  /**
   * Rate limiting helper
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Make request to YouTube API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('YouTube API Key not configured');
    }

    await this.enforceRateLimit();

    try {
      const url = new URL(`${this.baseURL}${endpoint}`);
      url.searchParams.append('key', this.apiKey);
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log(`[YouTubeAPI] Request: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpoilerShieldMobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[YouTubeAPI] Request failed:', error);
      throw error;
    }
  }

  /**
   * Search for videos
   */
  async searchVideos(query, options = {}) {
    const params = {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: options.limit || 25,
      order: options.order || 'relevance',
      safeSearch: options.safeSearch || 'moderate',
      videoDefinition: options.videoDefinition || 'any',
      videoDuration: options.videoBuration || 'any'
    };

    if (options.channelId) {
      params.channelId = options.channelId;
    }

    if (options.publishedAfter) {
      params.publishedAfter = options.publishedAfter;
    }

    if (options.publishedBefore) {
      params.publishedBefore = options.publishedBefore;
    }

    try {
      const response = await this.makeRequest('/search', params);
      return this.formatVideosResponse(response);
    } catch (error) {
      console.error('[YouTubeAPI] Failed to search videos:', error);
      return [];
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(options = {}) {
    const params = {
      part: 'snippet,statistics',
      chart: 'mostPopular',
      maxResults: options.limit || 25,
      regionCode: options.regionCode || 'US',
      videoCategoryId: options.categoryId || null
    };

    try {
      const response = await this.makeRequest('/videos', params);
      return this.formatVideosResponse(response, true);
    } catch (error) {
      console.error('[YouTubeAPI] Failed to fetch trending videos:', error);
      return [];
    }
  }

  /**
   * Get videos from a specific channel
   */
  async getChannelVideos(channelId, options = {}) {
    const params = {
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: options.limit || 25,
      order: options.order || 'date'
    };

    if (options.publishedAfter) {
      params.publishedAfter = options.publishedAfter;
    }

    try {
      const response = await this.makeRequest('/search', params);
      return this.formatVideosResponse(response);
    } catch (error) {
      console.error('[YouTubeAPI] Failed to fetch channel videos:', error);
      return [];
    }
  }

  /**
   * Get video details by ID
   */
  async getVideoDetails(videoId) {
    const params = {
      part: 'snippet,statistics,contentDetails',
      id: videoId
    };

    try {
      const response = await this.makeRequest('/videos', params);
      if (response.items && response.items.length > 0) {
        return this.formatVideo(response.items[0], true);
      }
      return null;
    } catch (error) {
      console.error('[YouTubeAPI] Failed to fetch video details:', error);
      return null;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId) {
    const params = {
      part: 'snippet,statistics',
      id: channelId
    };

    try {
      const response = await this.makeRequest('/channels', params);
      if (response.items && response.items.length > 0) {
        return this.formatChannel(response.items[0]);
      }
      return null;
    } catch (error) {
      console.error('[YouTubeAPI] Failed to fetch channel info:', error);
      return null;
    }
  }

  /**
   * Get video comments
   */
  async getVideoComments(videoId, options = {}) {
    const params = {
      part: 'snippet',
      videoId: videoId,
      maxResults: options.limit || 20,
      order: options.order || 'relevance'
    };

    try {
      const response = await this.makeRequest('/commentThreads', params);
      return this.formatCommentsResponse(response);
    } catch (error) {
      console.error('[YouTubeAPI] Failed to fetch video comments:', error);
      return [];
    }
  }

  /**
   * Format videos response
   */
  formatVideosResponse(response, includeStats = false) {
    if (!response.items) {
      return [];
    }

    return response.items.map(item => this.formatVideo(item, includeStats));
  }

  /**
   * Format individual video data
   */
  formatVideo(videoData, includeStats = false) {
    const snippet = videoData.snippet;
    const statistics = videoData.statistics;
    const contentDetails = videoData.contentDetails;

    return {
      id: videoData.id.videoId || videoData.id,
      title: snippet.title,
      description: snippet.description,
      created: new Date(snippet.publishedAt),
      
      // Channel info
      channel: {
        id: snippet.channelId,
        title: snippet.channelTitle
      },
      
      // Thumbnails
      thumbnails: {
        default: snippet.thumbnails.default?.url,
        medium: snippet.thumbnails.medium?.url,
        high: snippet.thumbnails.high?.url,
        standard: snippet.thumbnails.standard?.url,
        maxres: snippet.thumbnails.maxres?.url
      },
      
      // Video metadata
      categoryId: snippet.categoryId,
      tags: snippet.tags || [],
      
      // Statistics (if available)
      ...(includeStats && statistics ? {
        stats: {
          views: parseInt(statistics.viewCount) || 0,
          likes: parseInt(statistics.likeCount) || 0,
          comments: parseInt(statistics.commentCount) || 0
        }
      } : {}),
      
      // Content details (if available)
      ...(contentDetails ? {
        duration: this.parseDuration(contentDetails.duration),
        definition: contentDetails.definition,
        caption: contentDetails.caption === 'true'
      } : {}),
      
      // For ML analysis
      analysisContent: {
        title: snippet.title,
        description: snippet.description,
        channel: snippet.channelTitle,
        tags: snippet.tags || [],
        type: 'video'
      },
      
      // Direct URL to video
      url: `https://www.youtube.com/watch?v=${videoData.id.videoId || videoData.id}`
    };
  }

  /**
   * Format channel data
   */
  formatChannel(channelData) {
    const snippet = channelData.snippet;
    const statistics = channelData.statistics;

    return {
      id: channelData.id,
      title: snippet.title,
      description: snippet.description,
      created: new Date(snippet.publishedAt),
      
      // Channel art
      thumbnails: {
        default: snippet.thumbnails.default?.url,
        medium: snippet.thumbnails.medium?.url,
        high: snippet.thumbnails.high?.url
      },
      
      // Statistics
      stats: {
        subscribers: parseInt(statistics.subscriberCount) || 0,
        videos: parseInt(statistics.videoCount) || 0,
        views: parseInt(statistics.viewCount) || 0
      },
      
      // Metadata
      country: snippet.country,
      customUrl: snippet.customUrl,
      
      url: `https://www.youtube.com/channel/${channelData.id}`
    };
  }

  /**
   * Format comments response
   */
  formatCommentsResponse(response) {
    if (!response.items) {
      return [];
    }

    return response.items.map(item => this.formatComment(item.snippet.topLevelComment.snippet));
  }

  /**
   * Format individual comment
   */
  formatComment(commentData) {
    return {
      id: commentData.id || Math.random().toString(36).substr(2, 9),
      text: commentData.textDisplay,
      author: commentData.authorDisplayName,
      authorProfileImage: commentData.authorProfileImageUrl,
      authorChannelUrl: commentData.authorChannelUrl,
      created: new Date(commentData.publishedAt),
      likes: commentData.likeCount || 0,
      
      // For ML analysis
      analysisContent: {
        text: commentData.textDisplay,
        author: commentData.authorDisplayName,
        type: 'comment'
      }
    };
  }

  /**
   * Parse ISO 8601 duration (PT4M13S) to seconds
   */
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Get popular YouTube channels for suggestions
   */
  getDefaultChannels() {
    return [
      { id: 'UCBR8-60-B28hp2BmDPdntcQ', title: 'YouTube' },
      { id: 'UCF0pVplsI8R5kcAqgtoRqoA', title: 'YouTube Creators' },
      { id: 'UCqVDpXKJMi_g8T-yrxwJaEQ', title: 'YouTube Help' },
      { id: 'UCMDQxm7cUx3yXkfeHa5zJIQ', title: 'YouTube Space LA' }
    ];
  }

  /**
   * Get API usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: new Date(this.lastRequestTime),
      rateLimitDelay: this.rateLimitDelay,
      hasCredentials: !!this.apiKey
    };
  }

  /**
   * Reset API usage statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      await this.makeRequest('/search', {
        part: 'snippet',
        q: 'test',
        maxResults: 1,
        type: 'video'
      });
      return true;
    } catch (error) {
      console.error('[YouTubeAPI] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new YouTubeAPI();