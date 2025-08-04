
/**
 * Social Media API Service for Spoiler Shield Mobile
 * Handles Facebook Graph API and Instagram Basic Display API integration
 * Note: Limited to public content due to API restrictions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class SocialMediaAPI {
  constructor() {
    this.facebookBaseURL = 'https://graph.facebook.com/v18.0';
    this.instagramBaseURL = 'https://graph.instagram.com';
    
    this.accessToken = null;
    this.instagramToken = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // 1 second between requests
    
    this.loadCredentials();
  }

  /**
   * Load API credentials from storage
   */
  async loadCredentials() {
    try {
      const fbToken = await AsyncStorage.getItem('facebook_access_token');
      const igToken = await AsyncStorage.getItem('instagram_access_token');
      
      if (fbToken) {
        this.accessToken = fbToken;
      }
      if (igToken) {
        this.instagramToken = igToken;
      }
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to load credentials:', error);
    }
  }

  /**
   * Set Facebook API credentials
   */
  async setFacebookCredentials(accessToken) {
    try {
      this.accessToken = accessToken;
      await AsyncStorage.setItem('facebook_access_token', accessToken);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to save Facebook credentials:', error);
      throw new Error('Failed to save Facebook credentials');
    }
  }

  /**
   * Set Instagram API credentials
   */
  async setInstagramCredentials(accessToken) {
    try {
      this.instagramToken = accessToken;
      await AsyncStorage.setItem('instagram_access_token', accessToken);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to save Instagram credentials:', error);
      throw new Error('Failed to save Instagram credentials');
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
   * Make request to Facebook Graph API
   */
  async makeFacebookRequest(endpoint, params = {}) {
    if (!this.accessToken) {
      throw new Error('Facebook Access Token not configured');
    }

    await this.enforceRateLimit();

    try {
      const url = new URL(`${this.facebookBaseURL}${endpoint}`);
      url.searchParams.append('access_token', this.accessToken);
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log(`[SocialMediaAPI] Facebook Request: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpoilerShieldMobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SocialMediaAPI] Facebook request failed:', error);
      throw error;
    }
  }

  /**
   * Make request to Instagram API
   */
  async makeInstagramRequest(endpoint, params = {}) {
    if (!this.instagramToken) {
      throw new Error('Instagram Access Token not configured');
    }

    await this.enforceRateLimit();

    try {
      const url = new URL(`${this.instagramBaseURL}${endpoint}`);
      url.searchParams.append('access_token', this.instagramToken);
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log(`[SocialMediaAPI] Instagram Request: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpoilerShieldMobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SocialMediaAPI] Instagram request failed:', error);
      throw error;
    }
  }

  /**
   * Get Facebook page posts (public pages only)
   */
  async getFacebookPagePosts(pageId, options = {}) {
    const params = {
      fields: 'id,message,story,created_time,type,link,name,description,picture,full_picture,shares,reactions.summary(total_count),comments.summary(total_count)',
      limit: options.limit || 25
    };

    if (options.since) {
      params.since = Math.floor(options.since.getTime() / 1000);
    }

    if (options.until) {
      params.until = Math.floor(options.until.getTime() / 1000);
    }

    try {
      const response = await this.makeFacebookRequest(`/${pageId}/posts`, params);
      return this.formatFacebookPosts(response.data || []);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to fetch Facebook page posts:', error);
      return [];
    }
  }

  /**
   * Search Facebook pages (limited public search)
   */
  async searchFacebookPages(query, options = {}) {
    const params = {
      q: query,
      type: 'page',
      fields: 'id,name,about,category,picture,fan_count,website',
      limit: options.limit || 20
    };

    try {
      const response = await this.makeFacebookRequest('/search', params);
      return this.formatFacebookPages(response.data || []);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to search Facebook pages:', error);
      return [];
    }
  }

  /**
   * Get Instagram user media (requires user token)
   */
  async getInstagramUserMedia(options = {}) {
    const params = {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
      limit: options.limit || 25
    };

    try {
      const response = await this.makeInstagramRequest('/me/media', params);
      return this.formatInstagramMedia(response.data || []);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to fetch Instagram media:', error);
      return [];
    }
  }

  /**
   * Get Instagram hashtag media (limited to business accounts)
   */
  async getInstagramHashtagMedia(hashtag, options = {}) {
    try {
      // First get hashtag ID
      const hashtagResponse = await this.makeInstagramRequest(`/ig_hashtag_search`, {
        q: hashtag,
        user_id: 'me'
      });

      if (!hashtagResponse.data || hashtagResponse.data.length === 0) {
        return [];
      }

      const hashtagId = hashtagResponse.data[0].id;

      // Then get recent media
      const mediaResponse = await this.makeInstagramRequest(`/${hashtagId}/recent_media`, {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
        limit: options.limit || 25
      });

      return this.formatInstagramMedia(mediaResponse.data || []);
    } catch (error) {
      console.error('[SocialMediaAPI] Failed to fetch Instagram hashtag media:', error);
      return [];
    }
  }

  /**
   * Format Facebook posts for our app
   */
  formatFacebookPosts(posts) {
    return posts.map(post => this.formatFacebookPost(post));
  }

  /**
   * Format individual Facebook post
   */
  formatFacebookPost(postData) {
    return {
      id: postData.id,
      message: postData.message || postData.story || '',
      created: new Date(postData.created_time),
      type: postData.type,
      
      // Media
      link: postData.link,
      name: postData.name,
      description: postData.description,
      picture: postData.picture,
      fullPicture: postData.full_picture,
      
      // Engagement
      engagement: {
        reactions: postData.reactions?.summary?.total_count || 0,
        comments: postData.comments?.summary?.total_count || 0,
        shares: postData.shares?.count || 0
      },
      
      // For ML analysis
      analysisContent: {
        message: postData.message || postData.story || '',
        name: postData.name || '',
        description: postData.description || '',
        type: 'facebook-post'
      },
      
      // Direct URL
      url: `https://www.facebook.com/${postData.id}`
    };
  }

  /**
   * Format Facebook pages for our app
   */
  formatFacebookPages(pages) {
    return pages.map(page => ({
      id: page.id,
      name: page.name,
      about: page.about,
      category: page.category,
      picture: page.picture?.data?.url,
      fanCount: page.fan_count,
      website: page.website,
      url: `https://www.facebook.com/${page.id}`
    }));
  }

  /**
   * Format Instagram media for our app
   */
  formatInstagramMedia(media) {
    return media.map(item => this.formatInstagramMediaItem(item));
  }

  /**
   * Format individual Instagram media item
   */
  formatInstagramMediaItem(mediaData) {
    return {
      id: mediaData.id,
      caption: mediaData.caption || '',
      mediaType: mediaData.media_type,
      mediaUrl: mediaData.media_url,
      thumbnailUrl: mediaData.thumbnail_url,
      permalink: mediaData.permalink,
      timestamp: new Date(mediaData.timestamp),
      username: mediaData.username,
      
      // For ML analysis
      analysisContent: {
        caption: mediaData.caption || '',
        username: mediaData.username,
        type: 'instagram-post'
      }
    };
  }

  /**
   * Get popular Facebook pages for suggestions
   */
  getDefaultFacebookPages() {
    return [
      { id: '20531316728', name: 'Facebook', category: 'Technology' },
      { id: '9432520138', name: 'Instagram', category: 'Technology' },
      { id: '155869377766434', name: 'Netflix', category: 'Entertainment' },
      { id: '19394188523', name: 'NBA', category: 'Sports' },
      { id: '15704546335', name: 'Marvel Entertainment', category: 'Entertainment' }
    ];
  }

  /**
   * Get Instagram content types
   */
  getInstagramMediaTypes() {
    return [
      { id: 'IMAGE', name: 'Images', icon: 'image' },
      { id: 'VIDEO', name: 'Videos', icon: 'video' },
      { id: 'CAROUSEL_ALBUM', name: 'Albums', icon: 'images' }
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
      hasFacebookCredentials: !!this.accessToken,
      hasInstagramCredentials: !!this.instagramToken
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
   * Test Facebook API connection
   */
  async testFacebookConnection() {
    try {
      await this.makeFacebookRequest('/me', { fields: 'id,name' });
      return true;
    } catch (error) {
      console.error('[SocialMediaAPI] Facebook connection test failed:', error);
      return false;
    }
  }

  /**
   * Test Instagram API connection
   */
  async testInstagramConnection() {
    try {
      await this.makeInstagramRequest('/me', { fields: 'id,username' });
      return true;
    } catch (error) {
      console.error('[SocialMediaAPI] Instagram connection test failed:', error);
      return false;
    }
  }

  /**
   * Get authentication URLs for OAuth flow
   */
  getFacebookAuthUrl(appId, redirectUri) {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'pages_read_engagement,pages_show_list,public_profile',
      response_type: 'code'
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  getInstagramAuthUrl(appId, redirectUri) {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code'
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }
}

// Export singleton instance
export default new SocialMediaAPI();