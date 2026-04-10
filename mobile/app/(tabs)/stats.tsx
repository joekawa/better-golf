import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { api } from '../../lib/api';
import { Card } from '../../components/shared/Card';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

interface Stats {
  total_rounds: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  average_putts: number;
  average_fairways_hit: number;
  average_greens_in_regulation: number;
  total_birdies: number;
  total_pars: number;
  total_bogeys: number;
  handicap_index: string;
}

interface ScoreTrend {
  date: string;
  gross_score: number;
  net_score: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scoreTrends, setScoreTrends] = useState<ScoreTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'10' | '20' | '50' | 'all'>('20');

  const fetchStats = async () => {
    try {
      const statsResponse = await api.get('/rounds/stats_summary/');
      setStats(statsResponse.data);

      const trendsResponse = await api.get(`/rounds/?limit=${filter === 'all' ? 1000 : filter}`);
      const rounds = trendsResponse.data.results || trendsResponse.data;
      setScoreTrends(rounds.map((r: any) => ({
        date: r.date,
        gross_score: r.gross_score,
        net_score: r.net_score,
      })).reverse());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />;
  }

  if (!stats || stats.total_rounds === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">No Statistics Yet</Text>
        <Text className="text-gray-600 text-center">
          Add some rounds to see your golf statistics and trends
        </Text>
      </View>
    );
  }

  const calculateFIRPercentage = () => {
    if (!stats.average_fairways_hit) return 0;
    return Math.round((stats.average_fairways_hit / 14) * 100);
  };

  const calculateGIRPercentage = () => {
    if (!stats.average_greens_in_regulation) return 0;
    return Math.round((stats.average_greens_in_regulation / 18) * 100);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900">Statistics</Text>
        
        {/* Filter Buttons */}
        <View className="flex-row mt-3 gap-2">
          {(['10', '20', '50', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${
                filter === f ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                filter === f ? 'text-white' : 'text-gray-700'
              }`}>
                {f === 'all' ? 'All' : `Last ${f}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Overview Card */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Overview</Text>
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-sm text-gray-600">Total Rounds</Text>
                <Text className="text-2xl font-bold text-gray-900">{stats.total_rounds}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-sm text-gray-600">Avg Score</Text>
                <Text className="text-2xl font-bold text-green-600">
                  {stats.average_score?.toFixed(1) || 'N/A'}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-sm text-gray-600">Handicap</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.handicap_index || 'N/A'}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <View className="items-center">
                <Text className="text-xs text-gray-500">Best</Text>
                <Text className="text-lg font-semibold text-green-600">{stats.best_score}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">Worst</Text>
                <Text className="text-lg font-semibold text-red-600">{stats.worst_score}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">Avg Putts</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {stats.average_putts?.toFixed(1) || 'N/A'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Score Distribution */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Score Distribution</Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="w-20">
                  <Text className="text-sm font-semibold text-gray-900">Birdies</Text>
                </View>
                <View className="flex-1 bg-gray-200 h-8 rounded-lg overflow-hidden">
                  <View 
                    className="bg-green-500 h-full justify-center px-2"
                    style={{ width: `${Math.min((stats.total_birdies / stats.total_rounds) * 20, 100)}%` }}
                  >
                    <Text className="text-white text-xs font-semibold">{stats.total_birdies}</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="w-20">
                  <Text className="text-sm font-semibold text-gray-900">Pars</Text>
                </View>
                <View className="flex-1 bg-gray-200 h-8 rounded-lg overflow-hidden">
                  <View 
                    className="bg-blue-500 h-full justify-center px-2"
                    style={{ width: `${Math.min((stats.total_pars / stats.total_rounds) * 5, 100)}%` }}
                  >
                    <Text className="text-white text-xs font-semibold">{stats.total_pars}</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="w-20">
                  <Text className="text-sm font-semibold text-gray-900">Bogeys</Text>
                </View>
                <View className="flex-1 bg-gray-200 h-8 rounded-lg overflow-hidden">
                  <View 
                    className="bg-orange-500 h-full justify-center px-2"
                    style={{ width: `${Math.min((stats.total_bogeys / stats.total_rounds) * 5, 100)}%` }}
                  >
                    <Text className="text-white text-xs font-semibold">{stats.total_bogeys}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Accuracy Stats */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Accuracy</Text>
            <View className="space-y-4">
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-900">Fairways Hit</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {calculateFIRPercentage()}%
                  </Text>
                </View>
                <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
                  <View 
                    className="bg-green-600 h-full"
                    style={{ width: `${calculateFIRPercentage()}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Avg: {stats.average_fairways_hit?.toFixed(1) || 0}/14
                </Text>
              </View>
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-900">Greens in Regulation</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {calculateGIRPercentage()}%
                  </Text>
                </View>
                <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
                  <View 
                    className="bg-green-600 h-full"
                    style={{ width: `${calculateGIRPercentage()}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Avg: {stats.average_greens_in_regulation?.toFixed(1) || 0}/18
                </Text>
              </View>
            </View>
          </Card>

          {/* Score Trend */}
          {scoreTrends.length > 0 && (
            <Card className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Score Trend</Text>
              <View className="h-48 justify-end">
                <View className="flex-row items-end h-full">
                  {scoreTrends.slice(-10).map((trend, index) => {
                    const maxScore = Math.max(...scoreTrends.map(t => t.gross_score));
                    const minScore = Math.min(...scoreTrends.map(t => t.gross_score));
                    const range = maxScore - minScore || 1;
                    const height = ((trend.gross_score - minScore) / range) * 100;
                    
                    return (
                      <View key={index} className="flex-1 items-center">
                        <View 
                          className="w-full bg-green-600 rounded-t-lg mx-1"
                          style={{ height: `${Math.max(height, 20)}%` }}
                        >
                          <Text className="text-xs text-white text-center mt-1">
                            {trend.gross_score}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Text className="text-xs text-gray-500 text-center mt-2">
                Last {Math.min(scoreTrends.length, 10)} rounds
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
