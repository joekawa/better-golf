import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { api } from '../../lib/api';
import { Card } from '../../components/shared/Card';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { RoundsListSkeleton } from '../../components/shared/SkeletonLoader';
import { Button } from '../../components/shared/Button';
import { useRouter } from 'expo-router';
import { OfflineStorage } from '../../lib/storage/OfflineStorage';
import { syncManager } from '../../lib/sync/SyncManager';

interface Round {
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

export default function RoundsScreen() {
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pendingRounds, setPendingRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ count: 0, items: [] });

  const fetchRounds = async () => {
    try {
      if (syncManager.isNetworkAvailable()) {
        const response = await api.get('/rounds/');
        setRounds(response.data.results || response.data);
      }

      const pending = await OfflineStorage.getPendingRounds();
      setPendingRounds(pending);

      const status = await syncManager.getQueueStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRounds();
  };

  const handleSync = async () => {
    try {
      await syncManager.syncPendingData();
      await fetchRounds();
      Alert.alert('Success', 'All pending rounds synced!');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to sync rounds');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading rounds..." />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">Rounds</Text>
          <Button
            title="Add Round"
            onPress={() => router.push('/rounds/add')}
            variant="primary"
          />
        </View>

        {syncStatus.count > 0 && (
          <View className="flex-row items-center justify-between bg-yellow-50 p-3 rounded-lg">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-yellow-800">
                {syncStatus.count} round{syncStatus.count > 1 ? 's' : ''} pending sync
              </Text>
              <Text className="text-xs text-yellow-600 mt-1">
                {syncManager.isNetworkAvailable() ? 'Tap to sync now' : 'Will sync when online'}
              </Text>
            </View>
            {syncManager.isNetworkAvailable() && (
              <TouchableOpacity onPress={handleSync} className="bg-yellow-600 px-4 py-2 rounded-lg">
                <Text className="text-white font-semibold text-sm">Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {rounds.length === 0 && pendingRounds.length === 0 ? (
          <View className="items-center py-12 px-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">No rounds yet</Text>
            <Text className="text-gray-600 text-center mb-6">
              Start tracking your golf game by adding your first round
            </Text>
            <Button
              title="Add Your First Round"
              onPress={() => router.push('/rounds/add')}
              variant="primary"
            />
          </View>
        ) : (
          <View className="p-4">
            {rounds.map((round) => (
              <TouchableOpacity
                key={round.id}
                activeOpacity={0.7}
                className="mb-3"
                onPress={() => router.push(`/rounds/${round.id}`)}
              >
                <Card>
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{round.course_name}</Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        {round.date} • {round.score_type_display}
                      </Text>
                      {round.stats ? (
                        <View>
                          <Text className="text-xs text-gray-500 mt-2">
                            Eagles: {round.stats.eagles} | Birdies: {round.stats.birdies} | Pars: {round.stats.pars} | Bogeys: {round.stats.bogeys}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-1">
                            FIR: {round.stats.fairways_hit}/14 | GIR: {round.stats.greens_in_regulation}/18 | Putts: {round.stats.total_putts}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-xs text-gray-500 mt-2">No detailed stats</Text>
                      )}
                    </View>
                    <View className="items-end ml-4">
                      <Text className="text-2xl font-bold text-gray-900">{round.gross_score}</Text>
                      <Text className="text-sm text-gray-500">Net: {round.net_score}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
