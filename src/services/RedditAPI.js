/**
 * Reddit API Service
 * Handles fetching content from Reddit with proper rate limiting and error handling
 */
class RedditAPI {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.userAgent = 'SpoilerShield/1.0.0';
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // 1 second between requests
  }

  /**
   * Make rate-limited request to Reddit with better error handling
   */
  async makeRequest(endpoint, options = {}) {
    // Simple rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    // Use Reddit's public JSON endpoints (no auth required)
    const url = `${this.baseURL}${endpoint}.json`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // Remove User-Agent that might be causing issues
          ...options.headers
        },
        ...options
      });

      // Better error handling
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Subreddit not found or private`);
        } else if (response.status === 429) {
          throw new Error(`Rate limited - please wait before trying again`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - subreddit may be private`);
        } else {
          throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
        }
      }

      const text = await response.text();
      
      // Check if we got HTML instead of JSON (common Reddit issue)
      if (text.startsWith('<')) {
        throw new Error('Received HTML instead of JSON - Reddit may be blocking requests');
      }

      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error('[RedditAPI] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get posts from a subreddit with fallback to sample data
   */
  async getSubredditPosts(subreddit = 'all', sort = 'hot', limit = 25, after = null) {
    try {
      let endpoint = `/r/${subreddit}/${sort}`;
      const params = new URLSearchParams({
        limit: limit.toString(),
        raw_json: '1' // Prevent HTML encoding
      });

      if (after) {
        params.append('after', after);
      }

      endpoint += `?${params.toString()}`;

      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !response.data.children) {
        throw new Error('Invalid response format from Reddit API');
      }

      return {
        posts: response.data.children.map(child => this.formatPost(child.data)),
        after: response.data.after,
        before: response.data.before
      };
    } catch (error) {
      console.error('[RedditAPI] Failed to fetch subreddit posts:', error);
      
      // Return sample data for testing
      console.log('[RedditAPI] Using sample data for testing');
      return this.getSamplePosts(subreddit);
    }
  }

  /**
   * Get sample posts for testing when API fails
   */
  getSamplePosts(subreddit = 'all') {
    const timestamp = Date.now();
    const subredditPrefix = subreddit.toLowerCase();
    
    const samplePosts = [
      {
        id: `${subredditPrefix}_sample1_${timestamp}`,
        title: 'Hamilton wins dramatic Formula 1 race in spectacular fashion!',
        author: 'f1_fan_2024',
        subreddit: 'Formula1',
        score: 2847,
        upvoteRatio: 0.94,
        numComments: 856,
        created: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        url: `https://reddit.com/${subredditPrefix}_sample1`,
        permalink: `https://reddit.com/r/Formula1/comments/${subredditPrefix}_sample1`,
        selfText: 'What an incredible race! The championship battle continues with this amazing victory. The final laps were absolutely insane!',
        isVideo: false,
        isImage: false,
        thumbnail: null,
        media: { type: 'none', url: null, thumbnail: null, preview: null },
        isNSFW: false,
        isSpoiler: false,
        isLocked: false,
        isStickied: false,
        flair: 'Race Results',
        awards: 12,
        analysisContent: {
          title: 'Hamilton wins dramatic Formula 1 race in spectacular fashion!',
          body: 'What an incredible race! The championship battle continues with this amazing victory. The final laps were absolutely insane!',
          subreddit: 'Formula1',
          flair: 'Race Results',
          author: 'f1_fan_2024'
        }
      },
      {
        id: `${subredditPrefix}_sample2_${timestamp}`,
        title: 'House of the Dragon Season 2 finale discussion - SPOILERS',
        author: 'dragon_watcher',
        subreddit: 'gameofthrones',
        score: 1234,
        upvoteRatio: 0.89,
        numComments: 445,
        created: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        url: `https://reddit.com/${subredditPrefix}_sample2`,
        permalink: `https://reddit.com/r/gameofthrones/comments/${subredditPrefix}_sample2`,
        selfText: 'That ending was absolutely shocking! I can\'t believe what happened to that character. The dragons looked incredible though.',
        isVideo: false,
        isImage: false,
        thumbnail: null,
        media: { type: 'none', url: null, thumbnail: null, preview: null },
        isNSFW: false,
        isSpoiler: true,
        isLocked: false,
        isStickied: false,
        flair: 'Spoilers',
        awards: 8,
        analysisContent: {
          title: 'House of the Dragon Season 2 finale discussion - SPOILERS',
          body: 'That ending was absolutely shocking! I can\'t believe what happened to that character. The dragons looked incredible though.',
          subreddit: 'gameofthrones',
          flair: 'Spoilers',
          author: 'dragon_watcher'
        }
      },
      {
        id: `${subredditPrefix}_sample3_${timestamp}`,
        title: 'Beautiful sunset from my backyard today',
        author: 'nature_lover',
        subreddit: 'pics',
        score: 892,
        upvoteRatio: 0.96,
        numComments: 45,
        created: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        url: `https://reddit.com/${subredditPrefix}_sample3`,
        permalink: `https://reddit.com/r/pics/comments/${subredditPrefix}_sample3`,
        selfText: '',
        isVideo: false,
        isImage: true,
        thumbnail: 'https://picsum.photos/200/150?random=1',
        media: { 
          type: 'image', 
          url: 'https://picsum.photos/800/600?random=1', 
          thumbnail: 'https://picsum.photos/200/150?random=1', 
          preview: 'https://picsum.photos/400/300?random=1' 
        },
        isNSFW: false,
        isSpoiler: false,
        isLocked: false,
        isStickied: false,
        flair: 'Photography',
        awards: 3,
        analysisContent: {
          title: 'Beautiful sunset from my backyard today',
          body: '',
          subreddit: 'pics',
          flair: 'Photography',
          author: 'nature_lover'
        }
      },
      {
        id: `${subredditPrefix}_sample4_${timestamp}`,
        title: 'Marvel Phase 5 announcement - Iron Man return confirmed!',
        author: 'marvel_insider',
        subreddit: 'MarvelStudiosSpoilers',
        score: 5678,
        upvoteRatio: 0.92,
        numComments: 1234,
        created: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        url: `https://reddit.com/${subredditPrefix}_sample4`,
        permalink: `https://reddit.com/r/MarvelStudiosSpoilers/comments/${subredditPrefix}_sample4`,
        selfText: 'According to reliable sources, Tony Stark will be returning in the next Avengers movie. This is huge news for the MCU!',
        isVideo: false,
        isImage: false,
        thumbnail: null,
        media: { type: 'none', url: null, thumbnail: null, preview: null },
        isNSFW: false,
        isSpoiler: true,
        isLocked: false,
        isStickied: false,
        flair: 'Leak',
        awards: 25,
        analysisContent: {
          title: 'Marvel Phase 5 announcement - Iron Man return confirmed!',
          body: 'According to reliable sources, Tony Stark will be returning in the next Avengers movie. This is huge news for the MCU!',
          subreddit: 'MarvelStudiosSpoilers',
          flair: 'Leak',
          author: 'marvel_insider'
        }
      },
      {
        id: `${subredditPrefix}_sample5_${timestamp}`,
        title: 'Today I learned that octopuses have three hearts',
        author: 'fact_finder',
        subreddit: 'todayilearned',
        score: 3456,
        upvoteRatio: 0.98,
        numComments: 234,
        created: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        url: `https://reddit.com/${subredditPrefix}_sample5`,
        permalink: `https://reddit.com/r/todayilearned/comments/${subredditPrefix}_sample5`,
        selfText: 'Two pump blood to the gills, while the third pumps blood to the rest of the body. Nature is amazing!',
        isVideo: false,
        isImage: false,
        thumbnail: null,
        media: { type: 'none', url: null, thumbnail: null, preview: null },
        isNSFW: false,
        isSpoiler: false,
        isLocked: false,
        isStickied: false,
        flair: 'Animal Fact',
        awards: 5,
        analysisContent: {
          title: 'Today I learned that octopuses have three hearts',
          body: 'Two pump blood to the gills, while the third pumps blood to the rest of the body. Nature is amazing!',
          subreddit: 'todayilearned',
          flair: 'Animal Fact',
          author: 'fact_finder'
        }
      }
    ];

    return {
      posts: samplePosts,
      after: `${subredditPrefix}_sample_after_token_${timestamp}`,
      before: null
    };
  }

  /**
   * Get popular subreddits with fallback
   */
  async getPopularSubreddits(limit = 50) {
    try {
      const endpoint = `/subreddits/popular?limit=${limit}&raw_json=1`;
      const response = await this.makeRequest(endpoint);
      
      return response.data.children.map(child => ({
        name: child.data.display_name,
        title: child.data.title,
        description: child.data.public_description,
        subscribers: child.data.subscribers,
        icon: child.data.icon_img || child.data.community_icon,
        banner: child.data.banner_img,
        isNSFW: child.data.over18
      }));
    } catch (error) {
      console.error('[RedditAPI] Failed to fetch popular subreddits:', error);
      
      // Return default subreddits for testing
      return this.getDefaultSubreddits();
    }
  }

  /**
   * Search subreddits
   */
  async searchSubreddits(query, limit = 25) {
    try {
      const endpoint = `/subreddits/search?q=${encodeURIComponent(query)}&limit=${limit}&raw_json=1`;
      const response = await this.makeRequest(endpoint);
      
      return response.data.children.map(child => ({
        name: child.data.display_name,
        title: child.data.title,
        description: child.data.public_description,
        subscribers: child.data.subscribers,
        icon: child.data.icon_img || child.data.community_icon,
        isNSFW: child.data.over18
      }));
    } catch (error) {
      console.error('[RedditAPI] Failed to search subreddits:', error);
      return [];
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(subreddit, postId, sort = 'best', limit = 100) {
    try {
      const endpoint = `/r/${subreddit}/comments/${postId}?sort=${sort}&limit=${limit}&raw_json=1`;
      const response = await this.makeRequest(endpoint);
      
      if (!Array.isArray(response) || response.length < 2) {
        throw new Error('Invalid comments response format');
      }

      const commentsData = response[1].data.children;
      return commentsData.map(child => this.formatComment(child.data));
    } catch (error) {
      console.error('[RedditAPI] Failed to fetch post comments:', error);
      return [];
    }
  }

  /**
   * Format Reddit post data for our app
   */
  formatPost(postData) {
    return {
      id: postData.id,
      title: postData.title,
      author: postData.author,
      subreddit: postData.subreddit,
      score: postData.score,
      upvoteRatio: postData.upvote_ratio,
      numComments: postData.num_comments,
      created: new Date(postData.created_utc * 1000),
      url: postData.url,
      permalink: `https://reddit.com${postData.permalink}`,
      
      // Content
      selfText: postData.selftext || '',
      isVideo: postData.is_video,
      isImage: this.isImagePost(postData),
      thumbnail: postData.thumbnail !== 'self' ? postData.thumbnail : null,
      
      // Media
      media: this.extractMedia(postData),
      
      // Metadata
      isNSFW: postData.over_18,
      isSpoiler: postData.spoiler,
      isLocked: postData.locked,
      isStickied: postData.stickied,
      flair: postData.link_flair_text,
      
      // Awards (simplified)
      awards: postData.total_awards_received || 0,
      
      // For ML analysis
      analysisContent: {
        title: postData.title,
        body: postData.selftext || '',
        subreddit: postData.subreddit,
        flair: postData.link_flair_text || '',
        author: postData.author
      }
    };
  }

  /**
   * Format Reddit comment data
   */
  formatComment(commentData) {
    if (commentData.body === '[deleted]' || commentData.body === '[removed]') {
      return null;
    }

    return {
      id: commentData.id,
      author: commentData.author,
      body: commentData.body,
      score: commentData.score,
      created: new Date(commentData.created_utc * 1000),
      isStickied: commentData.stickied,
      depth: commentData.depth,
      parentId: commentData.parent_id,
      
      // For ML analysis
      analysisContent: {
        body: commentData.body,
        author: commentData.author,
        type: 'comment'
      },
      
      // Nested replies (simplified)
      replies: commentData.replies && commentData.replies.data
        ? commentData.replies.data.children
            .map(child => this.formatComment(child.data))
            .filter(comment => comment !== null)
        : []
    };
  }

  /**
   * Check if post contains an image
   */
  isImagePost(postData) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const url = postData.url.toLowerCase();
    
    return imageExtensions.some(ext => url.includes(ext)) ||
           postData.post_hint === 'image' ||
           (postData.preview && postData.preview.images);
  }

  /**
   * Extract media information from post
   */
  extractMedia(postData) {
    const media = {
      type: 'none',
      url: null,
      thumbnail: null,
      preview: null
    };

    // Image posts
    if (this.isImagePost(postData)) {
      media.type = 'image';
      media.url = postData.url;
      
      if (postData.preview && postData.preview.images && postData.preview.images[0]) {
        const preview = postData.preview.images[0];
        media.preview = preview.source.url.replace(/&amp;/g, '&');
        media.thumbnail = preview.resolutions && preview.resolutions[0]
          ? preview.resolutions[0].url.replace(/&amp;/g, '&')
          : media.preview;
      }
    }

    // Video posts
    if (postData.is_video && postData.media && postData.media.reddit_video) {
      media.type = 'video';
      media.url = postData.media.reddit_video.fallback_url;
      media.thumbnail = postData.thumbnail;
    }

    // External links
    if (media.type === 'none' && postData.url !== postData.permalink) {
      media.type = 'link';
      media.url = postData.url;
      media.thumbnail = postData.thumbnail !== 'self' ? postData.thumbnail : null;
    }

    return media;
  }

  /**
   * Get default/popular subreddits for new users
   */
  getDefaultSubreddits() {
    return [
      { name: 'all', title: 'All of Reddit', description: 'Popular posts from all subreddits' },
      { name: 'popular', title: 'Popular', description: 'Currently trending posts' },
      { name: 'AskReddit', title: 'Ask Reddit', description: 'Questions and discussions' },
      { name: 'funny', title: 'Funny', description: 'Humorous content' },
      { name: 'worldnews', title: 'World News', description: 'Global news and events' },
      { name: 'gaming', title: 'Gaming', description: 'Video game discussions' },
      { name: 'movies', title: 'Movies', description: 'Film discussions and news' },
      { name: 'television', title: 'Television', description: 'TV show discussions' },
      { name: 'sports', title: 'Sports', description: 'Sports news and discussions' },
      { name: 'technology', title: 'Technology', description: 'Tech news and discussions' }
    ];
  }

  /**
   * Get API usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: new Date(this.lastRequestTime),
      rateLimitDelay: this.rateLimitDelay
    };
  }

  /**
   * Reset API usage statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

// Export singleton instance
export default new RedditAPI();