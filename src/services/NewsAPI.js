/**
 * News API Service for Spoiler Shield Mobile
 * Handles Google News RSS feeds and general news aggregation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class NewsAPI {
  constructor() {
    this.rssBaseURL = 'https://news.google.com/rss';
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 500; // 500ms between requests
    
    // RSS to JSON conversion service (you may want to self-host this)
    this.rssToJsonService = 'https://api.rss2json.com/v1/api.json';
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
   * Convert RSS feed to JSON using service
   */
  async fetchRSSFeed(rssUrl, count = 25) {
    await this.enforceRateLimit();

    try {
      const url = new URL(this.rssToJsonService);
      url.searchParams.append('rss_url', rssUrl);
      url.searchParams.append('api_key', 'your-rss2json-api-key'); // Optional paid API key
      url.searchParams.append('count', count.toString());

      console.log(`[NewsAPI] Fetching RSS: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpoilerShieldMobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`RSS conversion error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`RSS conversion failed: ${data.message}`);
      }

      return data;
    } catch (error) {
      console.error('[NewsAPI] RSS fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get top headlines from Google News
   */
  async getTopHeadlines(options = {}) {
    const country = options.country || 'US';
    const language = options.language || 'en';
    const rssUrl = `${this.rssBaseURL}/headlines/section/topic/WORLD.${country}?hl=${language}&gl=${country}&ceid=${country}:${language}`;

    try {
      const response = await this.fetchRSSFeed(rssUrl, options.limit || 25);
      return this.formatArticles(response.items, 'top-headlines');
    } catch (error) {
      console.error('[NewsAPI] Failed to fetch top headlines:', error);
      return [];
    }
  }

  /**
   * Search Google News for specific topics
   */
  async searchNews(query, options = {}) {
    const country = options.country || 'US';
    const language = options.language || 'en';
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `${this.rssBaseURL}/search?q=${encodedQuery}&hl=${language}&gl=${country}&ceid=${country}:${language}`;

    try {
      const response = await this.fetchRSSFeed(rssUrl, options.limit || 25);
      return this.formatArticles(response.items, 'search', query);
    } catch (error) {
      console.error('[NewsAPI] Failed to search news:', error);
      return [];
    }
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category, options = {}) {
    const country = options.country || 'US';
    const language = options.language || 'en';
    const categoryMap = {
      'business': 'BUSINESS',
      'entertainment': 'ENTERTAINMENT',
      'health': 'HEALTH',
      'science': 'SCIENCE',
      'sports': 'SPORTS',
      'technology': 'TECHNOLOGY',
      'world': 'WORLD'
    };

    const googleCategory = categoryMap[category.toLowerCase()] || 'WORLD';
    const rssUrl = `${this.rssBaseURL}/headlines/section/topic/${googleCategory}.${country}?hl=${language}&gl=${country}&ceid=${country}:${language}`;

    try {
      const response = await this.fetchRSSFeed(rssUrl, options.limit || 25);
      return this.formatArticles(response.items, 'category', category);
    } catch (error) {
      console.error('[NewsAPI] Failed to fetch category news:', error);
      return [];
    }
  }

  /**
   * Get sports news (highly relevant for spoiler protection)
   */
  async getSportsNews(options = {}) {
    return this.getNewsByCategory('sports', options);
  }

  /**
   * Get entertainment news (movies, TV shows, etc.)
   */
  async getEntertainmentNews(options = {}) {
    return this.getNewsByCategory('entertainment', options);
  }

  /**
   * Get technology news
   */
  async getTechnologyNews(options = {}) {
    return this.getNewsByCategory('technology', options);
  }

  /**
   * Get news from custom RSS feeds
   */
  async getCustomRSSFeed(rssUrl, options = {}) {
    try {
      const response = await this.fetchRSSFeed(rssUrl, options.limit || 25);
      return this.formatArticles(response.items, 'custom-rss', rssUrl);
    } catch (error) {
      console.error('[NewsAPI] Failed to fetch custom RSS feed:', error);
      return [];
    }
  }

  /**
   * Format articles for our app
   */
  formatArticles(items, source, query = null) {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map(item => this.formatArticle(item, source, query));
  }

  /**
   * Format individual article
   */
  formatArticle(articleData, source, query = null) {
    // Clean up Google News URLs to get original source
    let cleanUrl = articleData.link;
    if (cleanUrl && cleanUrl.includes('news.google.com')) {
      const urlMatch = cleanUrl.match(/url=([^&]+)/);
      if (urlMatch) {
        cleanUrl = decodeURIComponent(urlMatch[1]);
      }
    }

    // Extract source from URL or use guid
    let sourceName = 'Unknown Source';
    try {
      const url = new URL(cleanUrl);
      sourceName = url.hostname.replace('www.', '');
    } catch (error) {
      // Fallback to parsing from description or title
      if (articleData.description) {
        const sourceMatch = articleData.description.match(/([^-]+)$/);
        if (sourceMatch) {
          sourceName = sourceMatch[1].trim();
        }
      }
    }

    return {
      id: this.generateArticleId(articleData),
      title: this.cleanTitle(articleData.title),
      description: this.cleanDescription(articleData.description),
      content: articleData.content || articleData.description,
      published: new Date(articleData.pubDate),
      
      // Source information
      source: {
        name: sourceName,
        url: cleanUrl
      },
      
      // URL and media
      url: cleanUrl,
      urlToImage: this.extractImageUrl(articleData),
      
      // Categories and tags
      categories: articleData.categories || [],
      
      // Metadata
      author: articleData.author || sourceName,
      searchQuery: query,
      sourceType: source,
      
      // For ML analysis
      analysisContent: {
        title: this.cleanTitle(articleData.title),
        description: this.cleanDescription(articleData.description),
        content: articleData.content || articleData.description,
        source: sourceName,
        categories: articleData.categories || [],
        type: 'news-article'
      }
    };
  }

  /**
   * Clean article title (remove source suffixes)
   */
  cleanTitle(title) {
    if (!title) return '';
    
    // Remove common source suffixes like " - CNN", " | BBC News", etc.
    return title
      .replace(/\s*[-|–—]\s*[^-|–—]*\s*(News|CNN|BBC|Reuters|AP|Fox|NBC|CBS|ABC).*$/i, '')
      .replace(/\s*[-|–—]\s*[A-Za-z\s]+\.(com|org|net).*$/i, '')
      .trim();
  }

  /**
   * Clean article description
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // Remove HTML tags and clean up
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Extract image URL from article data
   */
  extractImageUrl(articleData) {
    // Try enclosure first (RSS standard)
    if (articleData.enclosure && articleData.enclosure.link) {
      return articleData.enclosure.link;
    }

    // Try to extract from content or description
    if (articleData.content) {
      const imgMatch = articleData.content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    if (articleData.description) {
      const imgMatch = articleData.description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return null;
  }

  /**
   * Generate consistent article ID
   */
  generateArticleId(articleData) {
    if (articleData.guid) {
      return articleData.guid;
    }
    
    // Generate ID from URL and title
    const baseString = (articleData.link || '') + (articleData.title || '');
    return this.simpleHash(baseString);
  }

  /**
   * Simple hash function for generating IDs
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get popular news sources for suggestions
   */
  getDefaultSources() {
    return [
      {
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        category: 'general'
      },
      {
        name: 'CNN',
        url: 'http://rss.cnn.com/rss/edition.rss',
        category: 'general'
      },
      {
        name: 'Reuters',
        url: 'https://www.reutersagency.com/feed/?taxonomy=best-regions&post_type=best',
        category: 'general'
      },
      {
        name: 'ESPN',
        url: 'https://www.espn.com/espn/rss/news',
        category: 'sports'
      },
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'technology'
      },
      {
        name: 'Entertainment Weekly',
        url: 'https://ew.com/feed/',
        category: 'entertainment'
      }
    ];
  }

  /**
   * Get available news categories
   */
  getCategories() {
    return [
      { id: 'general', name: 'General', icon: 'newspaper' },
      { id: 'business', name: 'Business', icon: 'trending-up' },
      { id: 'entertainment', name: 'Entertainment', icon: 'film' },
      { id: 'health', name: 'Health', icon: 'heart' },
      { id: 'science', name: 'Science', icon: 'atom' },
      { id: 'sports', name: 'Sports', icon: 'football' },
      { id: 'technology', name: 'Technology', icon: 'cpu' },
      { id: 'world', name: 'World', icon: 'globe' }
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

  /**
   * Test RSS feed connection
   */
  async testConnection() {
    try {
      await this.getTopHeadlines({ limit: 1 });
      return true;
    } catch (error) {
      console.error('[NewsAPI] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new NewsAPI();