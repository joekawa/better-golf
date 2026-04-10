import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

interface HoleScore {
  hole_number: number;
  par: number;
  score: number;
  putts: number;
  fairway_hit: boolean;
  gir: boolean;
}

interface Round {
  id: number;
  course: {
    id: number;
    name: string;
    city: string;
    state: string;
  };
  course_tee: {
    id: number;
    name: string;
    rating: string;
    slope: number;
    par: number;
  };
  date: string;
  score_type: number;
  score_type_display: string;
  gross_score: number;
  net_score: number;
  hole_scores?: HoleScore[];
  stats?: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    double_bogeys: number;
    fairways_hit: number;
    greens_in_regulation: number;
    total_putts: number;
  };
}

export default function RoundDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoundDetails();
  }, [id]);

  const fetchRoundDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rounds/${id}/`);
      setRound(response.data);
    } catch (error) {
      console.error('Failed to fetch round details:', error);
      Alert.alert('Error', 'Failed to load round details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Round',
      'Are you sure you want to delete this round? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/rounds/${id}/`);
      Alert.alert('Success', 'Round deleted successfully');
      router.back();
    } catch (error) {
      console.error('Failed to delete round:', error);
      Alert.alert('Error', 'Failed to delete round');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/rounds/edit/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return 'text-purple-600'; // Eagle or better
    if (diff === -1) return 'text-green-600'; // Birdie
    if (diff === 0) return 'text-blue-600'; // Par
    if (diff === 1) return 'text-orange-600'; // Bogey
    return 'text-red-600'; // Double bogey or worse
  };

  const getScoreSymbol = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return '🦅'; // Eagle
    if (diff === -1) return '🐦'; // Birdie
    if (diff === 0) return '➖'; // Par
    if (diff === 1) return '⚠️'; // Bogey
    return '❌'; // Double bogey or worse
  };

  if (loading) {
    return <LoadingSpinner message="Loading round details..." />;
  }

  if (!round) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Round not found</Text>
      </View>
    );
  }

  const frontNine = round.hole_scores?.filter(h => h.hole_number <= 9) || [];
  const backNine = round.hole_scores?.filter(h => h.hole_number > 9) || [];
  const frontNineScore = frontNine.reduce((sum, h) => sum + h.score, 0);
  const backNineScore = backNine.reduce((sum, h) => sum + h.score, 0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-green-600 font-semibold text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleEdit}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              className="bg-red-600 px-4 py-2 rounded-lg"
            >
              {deleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Course Info Card */}
          <Card className="mb-4">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {round.course.name}
            </Text>
            <Text className="text-base text-gray-600 mb-1">
              {round.course.city}, {round.course.state}
            </Text>
            <Text className="text-base text-gray-600 mb-1">
              {round.course_tee.name} • Par {round.course_tee.par}
            </Text>
            <Text className="text-sm text-gray-500 mb-3">
              Rating: {round.course_tee.rating} • Slope: {round.course_tee.slope}
            </Text>
            <Text className="text-sm text-gray-500">
              {formatDate(round.date)}
            </Text>
          </Card>

          {/* Score Card */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Score</Text>
            <View className="flex-row justify-around mb-4">
              <View className="items-center">
                <Text className="text-sm text-gray-600 mb-1">Gross</Text>
                <Text className="text-4xl font-bold text-gray-900">
                  {round.gross_score}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-gray-600 mb-1">Net</Text>
                <Text className="text-4xl font-bold text-green-600">
                  {round.net_score}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-around pt-3 border-t border-gray-200">
              <View className="items-center">
                <Text className="text-xs text-gray-500">Score Type</Text>
                <Text className="text-sm font-semibold text-gray-900 mt-1">
                  {round.score_type_display}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">vs Par</Text>
                <Text className={`text-sm font-semibold mt-1 ${
                  round.gross_score - round.course_tee.par > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {round.gross_score - round.course_tee.par > 0 ? '+' : ''}
                  {round.gross_score - round.course_tee.par}
                </Text>
              </View>
            </View>
          </Card>

          {/* Hole-by-Hole Scorecard */}
          {round.hole_scores && round.hole_scores.length > 0 && (
            <Card className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Hole-by-Hole Scorecard
              </Text>

              {/* Front Nine */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Front Nine ({frontNineScore})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Header */}
                    <View className="flex-row mb-1">
                      <View className="w-12 items-center">
                        <Text className="text-xs font-semibold text-gray-600">Hole</Text>
                      </View>
                      {frontNine.map((hole) => (
                        <View key={hole.hole_number} className="w-12 items-center">
                          <Text className="text-xs font-semibold text-gray-900">
                            {hole.hole_number}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {/* Par */}
                    <View className="flex-row mb-1">
                      <View className="w-12 items-center">
                        <Text className="text-xs text-gray-600">Par</Text>
                      </View>
                      {frontNine.map((hole) => (
                        <View key={hole.hole_number} className="w-12 items-center">
                          <Text className="text-xs text-gray-700">{hole.par}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Score */}
                    <View className="flex-row mb-2">
                      <View className="w-12 items-center">
                        <Text className="text-xs text-gray-600">Score</Text>
                      </View>
                      {frontNine.map((hole) => (
                        <View key={hole.hole_number} className="w-12 items-center">
                          <Text className={`text-sm font-bold ${getScoreColor(hole.score, hole.par)}`}>
                            {hole.score}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {/* Indicators */}
                    <View className="flex-row">
                      <View className="w-12 items-center">
                        <Text className="text-xs text-gray-600"></Text>
                      </View>
                      {frontNine.map((hole) => (
                        <View key={hole.hole_number} className="w-12 items-center">
                          <Text className="text-base">
                            {getScoreSymbol(hole.score, hole.par)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>

              {/* Back Nine */}
              {backNine.length > 0 && (
                <View className="pt-3 border-t border-gray-200">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Back Nine ({backNineScore})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      {/* Header */}
                      <View className="flex-row mb-1">
                        <View className="w-12 items-center">
                          <Text className="text-xs font-semibold text-gray-600">Hole</Text>
                        </View>
                        {backNine.map((hole) => (
                          <View key={hole.hole_number} className="w-12 items-center">
                            <Text className="text-xs font-semibold text-gray-900">
                              {hole.hole_number}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {/* Par */}
                      <View className="flex-row mb-1">
                        <View className="w-12 items-center">
                          <Text className="text-xs text-gray-600">Par</Text>
                        </View>
                        {backNine.map((hole) => (
                          <View key={hole.hole_number} className="w-12 items-center">
                            <Text className="text-xs text-gray-700">{hole.par}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Score */}
                      <View className="flex-row mb-2">
                        <View className="w-12 items-center">
                          <Text className="text-xs text-gray-600">Score</Text>
                        </View>
                        {backNine.map((hole) => (
                          <View key={hole.hole_number} className="w-12 items-center">
                            <Text className={`text-sm font-bold ${getScoreColor(hole.score, hole.par)}`}>
                              {hole.score}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {/* Indicators */}
                      <View className="flex-row">
                        <View className="w-12 items-center">
                          <Text className="text-xs text-gray-600"></Text>
                        </View>
                        {backNine.map((hole) => (
                          <View key={hole.hole_number} className="w-12 items-center">
                            <Text className="text-base">
                              {getScoreSymbol(hole.score, hole.par)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              )}
            </Card>
          )}

          {/* Stats Card */}
          {round.stats && (
            <Card className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Statistics</Text>
              <View className="space-y-3">
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Eagles</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.eagles}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Birdies</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.birdies}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Pars</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.pars}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Bogeys</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.bogeys}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Double Bogeys+</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.double_bogeys}</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Fairways Hit</Text>
                  <Text className="font-semibold text-gray-900">
                    {round.stats.fairways_hit}/14 ({Math.round((round.stats.fairways_hit / 14) * 100)}%)
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-700">Greens in Regulation</Text>
                  <Text className="font-semibold text-gray-900">
                    {round.stats.greens_in_regulation}/18 ({Math.round((round.stats.greens_in_regulation / 18) * 100)}%)
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-700">Total Putts</Text>
                  <Text className="font-semibold text-gray-900">{round.stats.total_putts}</Text>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
