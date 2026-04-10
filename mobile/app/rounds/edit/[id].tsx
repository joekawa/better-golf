import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';
import { Card } from '../../../components/shared/Card';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

interface Round {
  id: number;
  course: {
    id: number;
    name: string;
  };
  course_tee: {
    id: number;
    name: string;
  };
  date: string;
  score_type: number;
  gross_score: number;
  net_score: number;
  hole_scores?: any[];
  stats?: {
    fairways_hit: number;
    greens_in_regulation: number;
    total_putts: number;
  };
}

export default function EditRoundScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState('');
  const [grossScore, setGrossScore] = useState('');
  const [fairwaysHit, setFairwaysHit] = useState('');
  const [greensInRegulation, setGreensInRegulation] = useState('');
  const [totalPutts, setTotalPutts] = useState('');

  useEffect(() => {
    fetchRoundDetails();
  }, [id]);

  const fetchRoundDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rounds/${id}/`);
      const roundData = response.data;
      setRound(roundData);
      
      // Populate form
      setDate(roundData.date);
      setGrossScore(roundData.gross_score.toString());
      setFairwaysHit(roundData.stats?.fairways_hit?.toString() || '');
      setGreensInRegulation(roundData.stats?.greens_in_regulation?.toString() || '');
      setTotalPutts(roundData.stats?.total_putts?.toString() || '');
    } catch (error) {
      console.error('Failed to fetch round details:', error);
      Alert.alert('Error', 'Failed to load round details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!date || !grossScore) {
      Alert.alert('Validation Error', 'Date and gross score are required');
      return;
    }

    const grossScoreNum = parseInt(grossScore);
    if (isNaN(grossScoreNum) || grossScoreNum < 18 || grossScoreNum > 200) {
      Alert.alert('Validation Error', 'Please enter a valid gross score (18-200)');
      return;
    }

    try {
      setSaving(true);

      // Update round
      const updateData: any = {
        date,
        gross_score: grossScoreNum,
      };

      await api.patch(`/rounds/${id}/`, updateData);

      // Update stats if provided
      if (round?.stats && (fairwaysHit || greensInRegulation || totalPutts)) {
        const statsData: any = {};
        
        if (fairwaysHit) {
          const fir = parseInt(fairwaysHit);
          if (!isNaN(fir) && fir >= 0 && fir <= 14) {
            statsData.fairways_hit = fir;
          }
        }
        
        if (greensInRegulation) {
          const gir = parseInt(greensInRegulation);
          if (!isNaN(gir) && gir >= 0 && gir <= 18) {
            statsData.greens_in_regulation = gir;
          }
        }
        
        if (totalPutts) {
          const putts = parseInt(totalPutts);
          if (!isNaN(putts) && putts >= 0 && putts <= 100) {
            statsData.total_putts = putts;
          }
        }

        if (Object.keys(statsData).length > 0) {
          // Find the stats ID for this round
          const statsResponse = await api.get(`/stats/?round=${id}`);
          if (statsResponse.data.results && statsResponse.data.results.length > 0) {
            const statsId = statsResponse.data.results[0].id;
            await api.patch(`/stats/${statsId}/`, statsData);
          }
        }
      }

      Alert.alert('Success', 'Round updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update round:', error);
      Alert.alert('Error', 'Failed to update round');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading round..." />;
  }

  if (!round) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Round not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={handleCancel}>
            <Text className="text-gray-600 font-semibold text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Edit Round</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text className={`font-semibold text-base ${saving ? 'text-gray-400' : 'text-green-600'}`}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Course Info (Read-only) */}
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-gray-600 mb-2">Course</Text>
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {round.course.name}
            </Text>
            <Text className="text-sm text-gray-600">
              {round.course_tee.name}
            </Text>
          </Card>

          {/* Editable Fields */}
          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Round Details</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Date</Text>
              <Input
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Format: YYYY-MM-DD (e.g., 2026-03-17)
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Gross Score *</Text>
              <Input
                value={grossScore}
                onChangeText={setGrossScore}
                placeholder="Enter gross score"
                keyboardType="number-pad"
              />
            </View>
          </Card>

          {/* Stats (Optional) */}
          {round.stats && (
            <Card className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Statistics (Optional)</Text>
              
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Fairways Hit (0-14)
                </Text>
                <Input
                  value={fairwaysHit}
                  onChangeText={setFairwaysHit}
                  placeholder="Enter fairways hit"
                  keyboardType="number-pad"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Greens in Regulation (0-18)
                </Text>
                <Input
                  value={greensInRegulation}
                  onChangeText={setGreensInRegulation}
                  placeholder="Enter greens in regulation"
                  keyboardType="number-pad"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Total Putts
                </Text>
                <Input
                  value={totalPutts}
                  onChangeText={setTotalPutts}
                  placeholder="Enter total putts"
                  keyboardType="number-pad"
                />
              </View>
            </Card>
          )}

          {/* Note about hole-by-hole */}
          {round.score_type === 1 && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <Text className="text-sm text-blue-800">
                ℹ️ This round has hole-by-hole data. Editing individual hole scores is not yet supported.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-6">
            <View className="flex-1">
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
              />
            </View>
            <View className="flex-1">
              <Button
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                variant="primary"
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
