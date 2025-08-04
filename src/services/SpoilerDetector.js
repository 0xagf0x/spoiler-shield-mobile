import StorageService from './StorageService';

class SpoilerDetector {
  static async analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { hasSpoiler: false, confidence: 0, matchedTerms: [] };
    }

    const watchlist = await StorageService.getWatchlist();
    const textLower = text.toLowerCase();
    const matchedTerms = [];
    
    // Basic keyword matching (we'll enhance this later)
    for (const term of watchlist) {
      const termLower = term.toLowerCase();
      
      // Exact match
      if (textLower.includes(termLower)) {
        matchedTerms.push(term);
        continue;
      }
      
      // Fuzzy matching for multi-word terms
      if (termLower.includes(' ')) {
        const words = termLower.split(' ').filter(word => word.length > 2);
        const foundWords = words.filter(word => textLower.includes(word));
        
        if (foundWords.length === words.length) {
          matchedTerms.push(term);
        } else if (foundWords.length >= Math.ceil(words.length * 0.7)) {
          // Partial match with 70% confidence
          matchedTerms.push(`${term} (partial)`);
        }
      }
    }
    
    const hasSpoiler = matchedTerms.length > 0;
    const confidence = hasSpoiler ? Math.min(0.95, 0.6 + (matchedTerms.length * 0.1)) : 0;
    
    // Update stats
    if (hasSpoiler) {
      StorageService.updateStats({ spoilersBlocked: 1, postsScanned: 1 });
    } else {
      StorageService.updateStats({ postsScanned: 1 });
    }
    
    return {
      hasSpoiler,
      confidence,
      matchedTerms: [...new Set(matchedTerms)] // Remove duplicates
    };
  }

  static async analyzeHTML(html) {
    if (!html) return { hasSpoiler: false, confidence: 0, matchedTerms: [] };
    
    // Extract text from HTML (basic approach)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return await this.analyzeText(textContent);
  }

  static getDefaultWatchlist() {
    return [
      'Formula 1', 'F1', 'Red Bull Racing',
      'House of the Dragon', 'Game of Thrones', 'GOT',
      'Stranger Things', 'Netflix',
      'Marvel', 'MCU', 'Avengers',
      'Star Wars', 'Mandalorian',
      'Premier League', 'Champions League',
      'NBA Finals', 'Super Bowl',
      'Taylor Swift', 'Drake'
    ];
  }
}

export default SpoilerDetector;