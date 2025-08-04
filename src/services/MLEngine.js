import StorageService from './StorageService';

/**
 * ML Engine for Spoiler Detection
 * 
 * Current: Rule-based detection with fuzzy matching
 * Future: TensorFlow Lite models for context understanding
 */
class MLEngine {
  constructor() {
    this.isInitialized = false;
    this.models = {
      textClassifier: null,
      contextAnalyzer: null,
      imageAnalyzer: null, // Future: for meme/screenshot analysis
    };
    
    // Confidence thresholds
    this.thresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
    };

    // Context weights for different content types
    this.contextWeights = {
      title: 1.0,
      body: 0.8,
      comment: 0.6,
      username: 0.3,
      subreddit: 0.4,
    };
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Future: Load TensorFlow Lite models
      // await this.loadTextClassificationModel();
      // await this.loadContextAnalysisModel();
      
      this.isInitialized = true;
      console.log('[MLEngine] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[MLEngine] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Analyze text content for spoilers using current rule-based approach
   * Future: Replace with BERT-based classification
   */
  async analyzeText(text, context = {}) {
    if (!text || typeof text !== 'string') {
      return this.createResult(false, 0, []);
    }

    const watchlist = await StorageService.getWatchlist();
    if (watchlist.length === 0) {
      return this.createResult(false, 0, []);
    }

    // Clean and prepare text
    const cleanText = this.preprocessText(text);
    
    // Find matching terms with context awareness
    const matches = await this.findSpoilerMatches(cleanText, watchlist, context);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(matches, cleanText, context);
    
    // Determine if content should be considered a spoiler
    const hasSpoiler = confidence >= this.thresholds.low;

    // Update statistics
    await this.updateStats(hasSpoiler);

    return this.createResult(hasSpoiler, confidence, matches);
  }

  /**
   * Preprocess text for analysis
   */
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Find spoiler matches with advanced pattern matching
   */
  async findSpoilerMatches(text, watchlist, context = {}) {
    const matches = [];
    
    for (const term of watchlist) {
      const termLower = term.toLowerCase().trim();
      if (!termLower) continue;

      const match = this.analyzeTerm(text, termLower, context);
      if (match.found) {
        matches.push({
          term: term,
          matchType: match.type,
          confidence: match.confidence,
          context: match.context,
        });
      }
    }

    return matches;
  }

  /**
   * Analyze individual term with multiple matching strategies
   */
  analyzeTerm(text, term, context) {
    // 1. Exact match
    if (text.includes(term)) {
      return {
        found: true,
        type: 'exact',
        confidence: 0.95,
        context: 'exact_match'
      };
    }

    // 2. Fuzzy matching for single words
    if (!term.includes(' ')) {
      const fuzzyMatches = this.findFuzzyMatches(text, term);
      if (fuzzyMatches.length > 0) {
        return {
          found: true,
          type: 'fuzzy',
          confidence: 0.7,
          context: 'single_word_fuzzy'
        };
      }
    }

    // 3. Multi-word term analysis
    if (term.includes(' ')) {
      const words = term.split(' ').filter(word => word.length > 2);
      const foundWords = words.filter(word => text.includes(word));
      
      if (foundWords.length === words.length) {
        return {
          found: true,
          type: 'multi_word_complete',
          confidence: 0.9,
          context: 'all_words_found'
        };
      } else if (foundWords.length >= Math.ceil(words.length * 0.7)) {
        return {
          found: true,
          type: 'multi_word_partial',
          confidence: 0.6 + (foundWords.length / words.length * 0.2),
          context: `partial_match_${foundWords.length}_of_${words.length}`
        };
      }
    }

    // 4. Contextual analysis (future: use NLP models)
    const contextualMatch = this.analyzeContextualMatch(text, term, context);
    if (contextualMatch.found) {
      return contextualMatch;
    }

    return { found: false };
  }

  /**
   * Find fuzzy matches for single words
   */
  findFuzzyMatches(text, term) {
    const variations = [
      term,
      `${term}s`, // Plural
      `${term}ed`, // Past tense
      `${term}ing`, // Present participle
      term.replace(/s$/, ''), // Remove trailing s
    ];

    return variations.filter(variation => text.includes(variation));
  }

  /**
   * Analyze contextual matches (future: use advanced NLP)
   */
  analyzeContextualMatch(text, term, context) {
    // Future: Implement BERT-based contextual analysis
    // For now, simple heuristics
    
    const spoilerKeywords = [
      'spoiler', 'spoilers', 'ending', 'finale', 'dies', 'death',
      'winner', 'wins', 'loses', 'result', 'results', 'outcome',
      'plot', 'twist', 'reveal', 'revealed', 'leaked'
    ];

    const hasSpoilerKeywords = spoilerKeywords.some(keyword => 
      text.includes(keyword)
    );

    if (hasSpoilerKeywords && text.includes(term.split(' ')[0])) {
      return {
        found: true,
        type: 'contextual',
        confidence: 0.5,
        context: 'spoiler_keywords_present'
      };
    }

    return { found: false };
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(matches, text, context) {
    if (matches.length === 0) return 0;

    // Base confidence from matches
    let confidence = 0;
    let weightSum = 0;

    for (const match of matches) {
      const weight = this.contextWeights[context.type] || 1.0;
      confidence += match.confidence * weight;
      weightSum += weight;
    }

    confidence = weightSum > 0 ? confidence / weightSum : 0;

    // Boost confidence for multiple matches
    if (matches.length > 1) {
      confidence = Math.min(0.95, confidence + (matches.length - 1) * 0.1);
    }

    // Temporal boost (future: integrate with release calendars)
    if (context.isRecent) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    // Content type adjustments
    if (context.type === 'title') {
      confidence = Math.min(0.95, confidence + 0.05);
    }

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create standardized result object
   */
  createResult(hasSpoiler, confidence, matches) {
    return {
      hasSpoiler,
      confidence,
      matchedTerms: matches.map(m => m.term),
      detailedMatches: matches,
      timestamp: new Date().toISOString(),
      version: '1.0.0-rule-based'
    };
  }

  /**
   * Update detection statistics
   */
  async updateStats(hasSpoiler) {
    const increment = {
      postsScanned: 1,
      spoilersBlocked: hasSpoiler ? 1 : 0
    };
    
    await StorageService.updateStats(increment);
  }

  /**
   * Future: Load TensorFlow Lite model for text classification
   */
  async loadTextClassificationModel() {
    // TODO: Implement TensorFlow Lite model loading
    // Platform-specific implementation needed
    console.log('[MLEngine] Text classification model loading not yet implemented');
  }

  /**
   * Future: Analyze images for spoiler content
   */
  async analyzeImage(imageUri, context = {}) {
    // TODO: Implement image analysis using TensorFlow Lite
    // - Text extraction from images (OCR)
    // - Scene detection
    // - Character recognition
    console.log('[MLEngine] Image analysis not yet implemented');
    
    return this.createResult(false, 0, []);
  }

  /**
   * Future: Batch analysis for feed optimization
   */
  async batchAnalyze(contentItems) {
    // TODO: Implement efficient batch processing
    // - Vectorized operations
    // - Parallel processing
    // - Caching for repeated content
    
    const results = [];
    for (const item of contentItems) {
      const result = await this.analyzeText(item.text, item.context);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get current model information
   */
  getModelInfo() {
    return {
      initialized: this.isInitialized,
      version: '1.0.0-rule-based',
      capabilities: {
        textAnalysis: true,
        imageAnalysis: false,
        contextualAnalysis: 'basic',
        batchProcessing: false
      },
      plannedUpgrades: {
        bertTextClassification: 'Phase 2',
        imageAnalysis: 'Phase 2',
        advancedNLP: 'Phase 3',
        customModelTraining: 'Phase 3'
      }
    };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig) {
    if (newConfig.thresholds) {
      this.thresholds = { ...this.thresholds, ...newConfig.thresholds };
    }
    
    if (newConfig.contextWeights) {
      this.contextWeights = { ...this.contextWeights, ...newConfig.contextWeights };
    }
    
    console.log('[MLEngine] Configuration updated:', newConfig);
  }
}

// Export singleton instance
export default new MLEngine();