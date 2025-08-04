/**
 * Twitter API Service for Spoiler Shield Mobile
 * Handles Twitter/X API v2 integration for protected browsing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class TwitterAPI {
  constructor() {
    this.baseURL = 'https://api.twitter.com/2';
    this.bearerToken = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // 1 second between requests
    
    this.loadCredentials();
  }

  /**
   * Load Twitter API credentials from storage
   */
  async loadCredentials() {
    try {
      const bearerToken = await AsyncStorage.getItem('twitter_bearer_token');
      if (bearerToken) {
        this.bearerToken = bearerToken;
      }
    } catch (error) {
      console.error('[TwitterAPI] Failed to load credentials:', error);
    }
  }

  /**
   * Set Twitter API credentials
   */
  async setCredentials(bearerToken) {
    try {
      this.bearerToken = bearerToken;
      await AsyncStorage.setItem('twitter_bearer_token', bearerToken);
    } catch (error) {
      console.error('[TwitterAPI] Failed to save credentials:', error);
      throw new Error('Failed to save Twitter credentials');
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
   * Make authenticated request to Twitter API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token not configured');
    }

    await this.enforceRateLimit();

    try {
      const url = new URL(`${this.baseURL}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log(`[TwitterAPI] Request: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SpoilerShieldMobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[TwitterAPI] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get user timeline tweets
   */
  async getUserTimeline(userId, options = {}) {
    const params = {
      max_results: options.limit || 25,
      'tweet.fields': 'id,text,author_id,created_at,public_metrics,context_annotations,entities,referenced_tweets',
      'user.fields': 'id,name,username,profile_image_url,verified',
      expansions: 'author_id,referenced_tweets.id,referenced_tweets.id.author_id',
      exclude: 'replies,retweets'
    };

    if (options.since_id) {
      params.since_id = options.since_id;
    }

    try {
      const response = await this.makeRequest(`/users/${userId}/tweets`, params);
      return this.formatTweetsResponse(response);
    } catch (error) {
      console.error('[TwitterAPI] Failed to fetch user timeline:', error);
      return [];
    }
  }

  /**
   * Get home timeline (requires OAuth 2.0 User Context)
   */
  async getHomeTimeline(options = {}) {
    const params = {
      max_results: options.limit || 25,
      'tweet.fields': 'id,text,author_id,created_at,public_metrics,context_annotations,entities,referenced_tweets',
      'user.fields': 'id,name,username,profile_image_url,verified',
      expansions: 'author_id,referenced_tweets.id,referenced_tweets.id.author_id'
    };

    if (options.since_id) {
      params.since_id = options.since_id;
    }

    try {
      const response = await this.makeRequest('/tweets/search/recent', {
        ...params,
        query: 'from:' + options.username || 'lang:en -is:retweet'
      });
      return this.formatTweetsResponse(response);
    } catch (error) {
      console.error('[TwitterAPI] Failed to fetch home timeline:', error);
      return [];
    }
  }

  /**
   * Search tweets by query
   */
  async searchTweets(query, options = {}) {
    const params = {
      query: query,
      max_results: options.limit || 25,
      'tweet.fields': 'id,text,author_id,created_at,public_metrics,context_annotations,entities,referenced_tweets',
      'user.fields': 'id,name,username,profile_image_url,verified',
      expansions: 'author_id,referenced_tweets.id,referenced_tweets.id.author_id',
      sort_order: 'recency'
    };

    if (options.since_id) {
      params.since_id = options.since_id;
    }

    try {
      const response = await this.makeRequest('/tweets/search/recent', params);
      return this.formatTweetsResponse(response);
    } catch (error) {
      console.error('[TwitterAPI] Failed to search tweets:', error);
      return [];
    }
  }

  /**
   * Get trending topics
   */
  async getTrends(woeid = 1) { // 1 = Worldwide
    try {
      const response = await this.makeRequest('/trends/place', { id: woeid });
      return response[0]?.trends || [];
    } catch (error) {
      console.error('[TwitterAPI] Failed to fetch trends:', error);
      return [];
    }
  }

  /**
   * Format Twitter API response for our app
   */
  formatTweetsResponse(response) {
    if (!response.data) {
      return [];
    }

    const users = {};
    const tweets = {};

    // Index users and referenced tweets
    if (response.includes) {
      if (response.includes.users) {
        response.includes.users.forEach(user => {
          users[user.id] = user;
        });
      }
      if (response.includes.tweets) {
        response.includes.tweets.forEach(tweet => {
          tweets[tweet.id] = tweet;
        });
      }
    }

    return response.data.map(tweet => this.formatTweet(tweet, users, tweets));
  }

  /**
   * Format individual tweet data
   */
  formatTweet(tweetData, users = {}, referencedTweets = {}) {
    const author = users[tweetData.author_id] || { 
      id: tweetData.author_id, 
      name: 'Unknown User', 
      username: 'unknown' 
    };

    let referencedTweet = null;
    if (tweetData.referenced_tweets && tweetData.referenced_tweets.length > 0) {
      const ref = tweetData.referenced_tweets[0];
      referencedTweet = {
        type: ref.type,
        id: ref.id,
        data: referencedTweets[ref.id] || null
      };
    }

    return {
      id: tweetData.id,
      text: tweetData.text,
      created: new Date(tweetData.created_at),
      
      // Author info
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        profileImage: author.profile_image_url,
        verified: author.verified || false
      },
      
      // Engagement metrics
      metrics: {
        retweets: tweetData.public_metrics?.retweet_count || 0,
        likes: tweetData.public_metrics?.like_count || 0,
        replies: tweetData.public_metrics?.reply_count || 0,
        quotes: tweetData.public_metrics?.quote_count || 0
      },
      
      // Referenced content
      referencedTweet,
      
      // Entities (hashtags, mentions, URLs)
      entities: tweetData.entities || {},
      
      // Context annotations (topics detected by Twitter)
      contextAnnotations: tweetData.context_annotations || [],
      
      // For ML analysis
      analysisContent: {
        text: tweetData.text,
        author: author.username,
        hashtags: tweetData.entities?.hashtags?.map(h => h.tag) || [],
        mentions: tweetData.entities?.mentions?.map(m => m.username) || [],
        type: 'tweet'
      },
      
      // Direct URL to tweet
      url: `https://twitter.com/${author.username}/status/${tweetData.id}`
    };
  }

  /**
   * Get popular Twitter accounts for suggestions
   */
  getDefaultAccounts() {
    return [
      { id: '783214', username: 'Twitter', name: 'Twitter' },
      { id: '6253282', username: 'TwitterAPI', name: 'Twitter API' },
      { id: '17874544', username: 'TwitterSupport', name: 'Twitter Support' },
      { id: '1526228120', username: 'TwitterSafety', name: 'Twitter Safety' }
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
      hasCredentials: !!this.bearerToken
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
      await this.makeRequest('/tweets/search/recent', {
        query: 'hello',
        max_results: 1
      });
      return true;
    } catch (error) {
      console.error('[TwitterAPI] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new TwitterAPI();