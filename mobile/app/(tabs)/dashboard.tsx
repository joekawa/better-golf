import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { DashboardSkeleton } from '../../components/shared/SkeletonLoader';
import { syncManager } from '../../lib/sync/SyncManager';
import { OfflineStorage } from '../../lib/storage/OfflineStorage';
import { useRouter } from 'expo-router';

interface Stats {
  total_rounds: number;
  average_score: number;
  best_score: number;
  worst_score: number;
}

interface RecentRound {
  id: number;
  course_name: string;
  date: string;
  score_type_display: string;
  gross_score: number;
  net_score: number;
  stats?: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    double_bogeys: number;
    fairways_hit: number;
    greens_in_regulation: number;
    total_putts: number;
  } | null;
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRounds, setRecentRounds] = useState<RecentRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ count: 0, items: [] });
  const [isOnline, setIsOnline] = useState(true);

  const fetchData = async () => {
    try {
      setIsOnline(syncManager.isNetworkAvailable());

      if (syncManager.isNetworkAvailable()) {
        const [statsRes, roundsRes] = await Promise.all([
          api.get('/rounds/stats_summary/'),
          api.get('/rounds/recent/?limit=3')
        ]);
        setStats(statsRes.data);
        setRecentRounds(roundsRes.data);
      }

      const status = await syncManager.getQueueStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    syncManager.startAutoSync(60000);

    return () => {
      syncManager.stopAutoSync();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSync = async () => {
    try {
      await syncManager.syncPendingData();
      await fetchData();
      Alert.alert('Success', 'All data synced successfully!');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Network Status Banner */}
        {!isOnline && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <Text className="text-sm font-semibold text-yellow-800">Offline Mode</Text>
            <Text className="text-xs text-yellow-600 mt-1">
              You can still add rounds. They'll sync when you're back online.
            </Text>
          </View>
        )}

        {/* Sync Status Banner */}
        {syncStatus.count > 0 && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-800">
                  {syncStatus.count} item{syncStatus.count > 1 ? 's' : ''} pending sync
                </Text>
                <Text className="text-xs text-blue-600 mt-1">
                  {isOnline ? 'Tap to sync now' : 'Will sync when online'}
                </Text>
              </View>
              {isOnline && (
                <TouchableOpacity
                  onPress={handleSync}
                  className="bg-blue-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold text-sm">Sync</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Welcome Card */}
        <Card className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.display_name || 'Golfer'}!
          </Text>
          <Text className="text-gray-600 mb-4">
            Track your rounds and improve your game
          </Text>
          <Button
            title="Start New Round"
            onPress={() => router.push('/rounds/add')}
            variant="primary"
          />
        </Card>

        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-sm text-gray-600">Rounds</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_rounds || 0}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-sm text-gray-600">Avg</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.average_score?.toFixed(1) || '-'}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-sm text-gray-600">Best</Text>
              <Text className="text-2xl font-bold text-green-600 mt-1">
                {stats?.best_score || '-'}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-sm text-gray-600">Worst</Text>
              <Text className="text-2xl font-bold text-red-600 mt-1">
                {stats?.worst_score || '-'}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Rounds
          </Text>
          {recentRounds.length === 0 ? (
            <Text className="text-center text-gray-500 py-4">
              No rounds yet. Start tracking your golf game!
            </Text>
          ) : (
            recentRounds.map((round) => (
              <View
                key={round.id}
                className="border-b border-gray-200 py-3 last:border-b-0"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {round.course_name}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {round.date} • {round.score_type_display}
                    </Text>
                    {round.stats && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Eagles: {round.stats.eagles} | Birdies: {round.stats.birdies} | Pars: {round.stats.pars}
                      </Text>
                    )}
                  </View>
                  <View className="items-end ml-4">
                    <Text className="text-xl font-bold text-gray-900">
                      {round.gross_score}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Net: {round.net_score}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
