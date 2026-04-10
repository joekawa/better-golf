import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineStorage {
  private static readonly KEYS = {
    ACTIVE_ROUND: 'active_round',
    PENDING_ROUNDS: 'pending_rounds',
    CACHED_COURSES: 'cached_courses',
    CACHED_STATS: 'cached_stats',
    USER_PROFILE: 'user_profile',
    SYNC_QUEUE: 'sync_queue',
  };

  static async getActiveRound(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.ACTIVE_ROUND);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting active round:', error);
      return null;
    }
  }

  static async setActiveRound(round: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.ACTIVE_ROUND, JSON.stringify(round));
    } catch (error) {
      console.error('Error setting active round:', error);
    }
  }

  static async clearActiveRound(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.ACTIVE_ROUND);
    } catch (error) {
      console.error('Error clearing active round:', error);
    }
  }

  static async getPendingRounds(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PENDING_ROUNDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending rounds:', error);
      return [];
    }
  }

  static async addPendingRound(round: any): Promise<void> {
    try {
      const pending = await this.getPendingRounds();
      pending.push(round);
      await AsyncStorage.setItem(this.KEYS.PENDING_ROUNDS, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending round:', error);
    }
  }

  static async setPendingRounds(rounds: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.PENDING_ROUNDS, JSON.stringify(rounds));
    } catch (error) {
      console.error('Error setting pending rounds:', error);
    }
  }

  static async clearPendingRounds(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.PENDING_ROUNDS, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing pending rounds:', error);
    }
  }

  static async getCachedCourses(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.CACHED_COURSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting cached courses:', error);
      return [];
    }
  }

  static async setCachedCourses(courses: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CACHED_COURSES, JSON.stringify(courses));
    } catch (error) {
      console.error('Error setting cached courses:', error);
    }
  }

  static async getCachedStats(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.CACHED_STATS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached stats:', error);
      return null;
    }
  }

  static async setCachedStats(stats: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CACHED_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error setting cached stats:', error);
    }
  }

  static async getSyncQueue(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  static async addToSyncQueue(item: any): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push({ ...item, timestamp: Date.now(), attempts: 0 });
      await AsyncStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  static async updateSyncQueue(queue: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error updating sync queue:', error);
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  static async getUserProfile(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async setUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error setting user profile:', error);
    }
  }

  static async clearUserProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  }
}
