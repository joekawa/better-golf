import NetInfo from '@react-native-community/netinfo';
import api from '../api';
import { OfflineStorage } from '../storage/OfflineStorage';

export interface SyncQueueItem {
  id: string;
  type: 'round' | 'stats';
  data: any;
  timestamp: number;
  retries: number;
}

class SyncManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Network restored, starting sync...');
        this.syncPendingData();
      }
    });
  }

  async addToSyncQueue(type: 'round' | 'stats', data: any): Promise<string> {
    const item: SyncQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = await OfflineStorage.getSyncQueue();
    queue.push(item);
    await OfflineStorage.setSyncQueue(queue);

    if (this.isOnline) {
      this.syncPendingData();
    }

    return item.id;
  }

  async syncPendingData(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    const queue = await OfflineStorage.getSyncQueue();
    if (queue.length === 0) {
      console.log('No items to sync');
      return;
    }

    this.isSyncing = true;
    console.log(`Starting sync of ${queue.length} items...`);

    const failedItems: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await this.syncItem(item);
        console.log(`Successfully synced item ${item.id}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        item.retries += 1;

        if (item.retries < 3) {
          failedItems.push(item);
        } else {
          console.error(`Item ${item.id} exceeded max retries, discarding`);
        }
      }
    }

    await OfflineStorage.setSyncQueue(failedItems);
    this.isSyncing = false;

    console.log(`Sync complete. ${failedItems.length} items remain in queue`);
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'round':
        await this.syncRound(item.data);
        break;
      case 'stats':
        await this.syncStats(item.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private async syncRound(roundData: any): Promise<void> {
    const response = await api.post('/rounds/', roundData);
    const roundId = response.data.id;

    if (roundData.score_type === 1 && roundData.hole_scores) {
      await api.post('/stats/calculate_from_round/', { round_id: roundId });
    } else if (roundData.manual_stats) {
      await api.post('/stats/', {
        round: roundId,
        ...roundData.manual_stats,
      });
    }

    const pendingRounds = await OfflineStorage.getPendingRounds();
    const updatedRounds = pendingRounds.filter(r => r.timestamp !== roundData.timestamp);
    await OfflineStorage.setPendingRounds(updatedRounds);
  }

  private async syncStats(statsData: any): Promise<void> {
    await api.post('/stats/', statsData);
  }

  startAutoSync(intervalMs: number = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingData();
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getQueueStatus(): Promise<{ count: number; items: SyncQueueItem[] }> {
    const queue = await OfflineStorage.getSyncQueue();
    return {
      count: queue.length,
      items: queue,
    };
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }
}

export const syncManager = new SyncManager();
