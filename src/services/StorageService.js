import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  static KEYS = {
    WATCHLIST: 'spoiler_shield_watchlist',
    SETTINGS: 'spoiler_shield_settings',
    STATS: 'spoiler_shield_stats'
  };

  static async getWatchlist() {
    try {
      const watchlist = await AsyncStorage.getItem(this.KEYS.WATCHLIST);
      return watchlist ? JSON.parse(watchlist) : [];
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  static async saveWatchlist(watchlist) {
    try {
      await AsyncStorage.setItem(this.KEYS.WATCHLIST, JSON.stringify(watchlist));
      return true;
    } catch (error) {
      console.error('Error saving watchlist:', error);
      return false;
    }
  }

  static async addToWatchlist(term) {
    const watchlist = await this.getWatchlist();
    if (!watchlist.some(item => item.toLowerCase() === term.toLowerCase())) {
      watchlist.push(term);
      return await this.saveWatchlist(watchlist);
    }
    return false; // Already exists
  }

  static async removeFromWatchlist(term) {
    const watchlist = await this.getWatchlist();
    const filtered = watchlist.filter(item => item.toLowerCase() !== term.toLowerCase());
    return await this.saveWatchlist(filtered);
  }

  static async getStats() {
    try {
      const stats = await AsyncStorage.getItem(this.KEYS.STATS);
      return stats ? JSON.parse(stats) : {
        spoilersBlocked: 0,
        postsScanned: 0,
        lastScanDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { spoilersBlocked: 0, postsScanned: 0, lastScanDate: new Date().toISOString() };
    }
  }

  static async updateStats(increment = {}) {
    const stats = await this.getStats();
    const newStats = {
      ...stats,
      spoilersBlocked: stats.spoilersBlocked + (increment.spoilersBlocked || 0),
      postsScanned: stats.postsScanned + (increment.postsScanned || 0),
      lastScanDate: new Date().toISOString()
    };
    
    try {
      await AsyncStorage.setItem(this.KEYS.STATS, JSON.stringify(newStats));
      return newStats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return stats;
    }
  }
}

export default StorageService;