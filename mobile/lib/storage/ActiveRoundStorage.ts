import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveRound {
  courseId: number;
  courseName: string;
  teeId: number;
  teeName: string;
  date: string;
  scoreType: 'hole_by_hole' | 'total';
  holes: any[];
  holeScores: any[];
  currentHoleIndex: number;
  timestamp: number;
}

const ACTIVE_ROUND_KEY = 'active_round';

export class ActiveRoundStorage {
  static async saveActiveRound(round: ActiveRound): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_ROUND_KEY, JSON.stringify(round));
    } catch (error) {
      console.error('Error saving active round:', error);
      throw error;
    }
  }

  static async getActiveRound(): Promise<ActiveRound | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_ROUND_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting active round:', error);
      return null;
    }
  }

  static async clearActiveRound(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_ROUND_KEY);
    } catch (error) {
      console.error('Error clearing active round:', error);
      throw error;
    }
  }

  static async hasActiveRound(): Promise<boolean> {
    try {
      const round = await this.getActiveRound();
      return round !== null;
    } catch (error) {
      return false;
    }
  }
}
