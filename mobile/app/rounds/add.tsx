import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { OfflineStorage } from '../../lib/storage/OfflineStorage';
import { ActiveRoundStorage } from '../../lib/storage/ActiveRoundStorage';
import { syncManager } from '../../lib/sync/SyncManager';

interface Course {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
}

interface Tee {
  id: number;
  name: string;
  rating: string;
  slope: number;
  par: number;
}

interface Hole {
  id: number;
  hole_number: number;
  par: number;
  distance: number;
}

interface HoleScore {
  hole: number;
  strokes: number;
  putts: number;
  fairway_hit: boolean;
  gir: boolean;
}

export default function AddRoundScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);

  // Course search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasShownSearchFallbackAlert, setHasShownSearchFallbackAlert] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Tee selection
  const [tees, setTees] = useState<Tee[]>([]);
  const [selectedTee, setSelectedTee] = useState<Tee | null>(null);
  const [loadingTees, setLoadingTees] = useState(false);

  // Round details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scoreType, setScoreType] = useState<'hole_by_hole' | 'total' | null>(null);
  const [scoreTypeId, setScoreTypeId] = useState<number | null>(null);

  // Hole-by-hole
  const [holes, setHoles] = useState<Hole[]>([]);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);

  // Total score
  const [grossScore, setGrossScore] = useState('');
  const [manualStats, setManualStats] = useState({
    fairways_hit: '',
    greens_in_regulation: '',
    total_putts: '',
  });

  const [saving, setSaving] = useState(false);

  // Load recent courses from cache and check for active round
  useEffect(() => {
    loadRecentCourses();
    checkForActiveRound();
  }, []);

  // Auto-save active round progress
  useEffect(() => {
    if (selectedCourse && selectedTee && scoreType === 'hole_by_hole' && holes.length > 0) {
      saveActiveRoundProgress();
    }
  }, [holeScores, currentHoleIndex]);

  const checkForActiveRound = async () => {
    const activeRound = await ActiveRoundStorage.getActiveRound();
    if (activeRound) {
      Alert.alert(
        'Resume Round',
        `You have an in-progress round at ${activeRound.courseName}. Would you like to resume?`,
        [
          {
            text: 'Start New',
            onPress: () => ActiveRoundStorage.clearActiveRound(),
            style: 'destructive',
          },
          {
            text: 'Resume',
            onPress: () => resumeActiveRound(activeRound),
          },
        ]
      );
    }
  };

  const resumeActiveRound = async (activeRound: any) => {
    setSelectedCourse({
      id: activeRound.courseId,
      name: activeRound.courseName,
      city: '',
      state: '',
      country: '',
    });
    setSelectedTee({
      id: activeRound.teeId,
      name: activeRound.teeName,
      rating: '',
      slope: 0,
      par: 0,
    });
    setDate(activeRound.date);
    setScoreType(activeRound.scoreType);
    setHoles(activeRound.holes);
    setHoleScores(activeRound.holeScores);
    setCurrentHoleIndex(activeRound.currentHoleIndex);
    setStep(4);
  };

  const saveActiveRoundProgress = async () => {
    if (!selectedCourse || !selectedTee) return;

    const activeRound = {
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTee.id,
      teeName: selectedTee.name,
      date,
      scoreType: scoreType!,
      holes,
      holeScores,
      currentHoleIndex,
      timestamp: Date.now(),
    };

    await ActiveRoundStorage.saveActiveRound(activeRound);
  };

  const loadRecentCourses = async () => {
    const cached = await OfflineStorage.getCachedCourses();
    setRecentCourses(cached.slice(0, 5));
  };

  const searchCourses = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await api.get(`/courses/search/?q=${searchQuery}`);

      const payload = Array.isArray(response.data)
        ? { source: 'api', results: response.data }
        : response.data;

      console.log('Search response:', {
        source: payload.source,
        count: (payload.results || []).length,
        fallback_reason: payload.fallback_reason,
        api_status_code: payload.api_status_code,
      });

      if (payload.source === 'cache') {
        if (payload.fallback_reason === 'api_unauthorized' && !hasShownSearchFallbackAlert) {
          Alert.alert(
            'Course Search Notice',
            'Live course search is unavailable due to API authentication. Showing cached results.'
          );
          setHasShownSearchFallbackAlert(true);
        } else if (payload.fallback_reason && payload.fallback_reason !== 'api_unauthorized' && !hasShownSearchFallbackAlert) {
          Alert.alert('Course Search Notice', payload.message || 'Using cached course results.');
          setHasShownSearchFallbackAlert(true);
        }
      } else {
        setHasShownSearchFallbackAlert(false);
      }

      setSearchResults(payload.results || []);
    } catch (error) {
      console.error('Error searching courses:', error);
      Alert.alert('Error', 'Failed to search courses');
    } finally {
      setSearching(false);
    }
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);

    // Cache the selected course
    const cached = await OfflineStorage.getCachedCourses();
    const updated = [course, ...cached.filter(c => c.id !== course.id)].slice(0, 10);
    await OfflineStorage.setCachedCourses(updated);

    // Load tees
    setLoadingTees(true);
    try {
      const response = await api.get(`/courses/${course.id}/tees/`);
      setTees(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error loading tees:', error);
      Alert.alert('Error', 'Failed to load tees');
    } finally {
      setLoadingTees(false);
    }
  };

  const selectTee = async (tee: Tee) => {
    setSelectedTee(tee);

    // Load holes
    try {
      const response = await api.get(`/holes/?tee_id=${tee.id}`);
      const holesData = response.data.results || response.data;
      setHoles(holesData);

      // Initialize hole scores
      const initialScores = holesData.map((hole: Hole) => ({
        hole: hole.id,
        strokes: 0,
        putts: 0,
        fairway_hit: false,
        gir: false,
      }));
      setHoleScores(initialScores);

      setStep(3);
    } catch (error) {
      console.error('Error loading holes:', error);
      Alert.alert('Error', 'Failed to load holes');
    }
  };

  const selectScoreType = async (type: 'hole_by_hole' | 'total') => {
    setScoreType(type);

    // Fetch the correct ScoreType ID from the API
    try {
      const response = await api.get('/score-types/');
      console.log('ScoreTypes response:', response.data);

      const scoreTypes = response.data.results || response.data;

      // Find the ScoreType with the matching type value
      // type=0 is TOTAL, type=1 is HOLE_BY_HOLE
      const targetType = type === 'hole_by_hole' ? 1 : 0;
      const scoreTypeObj = scoreTypes.find((st: any) => st.type === targetType);

      console.log(`Looking for type=${targetType}, found:`, scoreTypeObj);

      if (scoreTypeObj) {
        setScoreTypeId(scoreTypeObj.id);
        console.log(`Set scoreTypeId to ${scoreTypeObj.id} for ${type}`);
      } else {
        console.error('ScoreType not found for type:', type);
        Alert.alert('Error', 'Failed to load score type. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Error fetching score types:', error);
      Alert.alert('Error', 'Failed to load score types. Please check your connection.');
      return;
    }

    // Holes are already loaded in selectTee, just proceed to step 4
    setStep(4);
  };

  const updateHoleScore = (field: keyof HoleScore, value: any) => {
    const updated = [...holeScores];
    updated[currentHoleIndex] = {
      ...updated[currentHoleIndex],
      [field]: value,
    };
    setHoleScores(updated);
  };

  const nextHole = () => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  const previousHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const calculateGrossFromHoles = () => {
    return holeScores.reduce((sum, score) => sum + score.strokes, 0);
  };

  const calculateNetScore = (gross: number) => {
    if (!selectedTee || !profile?.handicap_index) return gross;
    const courseHandicap = Math.round(
      (parseFloat(profile.handicap_index) * selectedTee.slope) / 113
    );
    return gross - courseHandicap;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!selectedCourse || !selectedTee || !date) {
        Alert.alert('Validation Error', 'Please select course, tee, and date');
        setSaving(false);
        return;
      }

      if (scoreType === 'total' && (!grossScore || isNaN(parseInt(grossScore)))) {
        Alert.alert('Validation Error', 'Please enter a valid gross score');
        setSaving(false);
        return;
      }

      if (scoreType === 'hole_by_hole' && holeScores.length === 0) {
        Alert.alert('Validation Error', 'Please enter hole scores');
        setSaving(false);
        return;
      }

      const roundData: any = {
        course: selectedCourse?.id,
        course_tee: selectedTee?.id,
        date,
        score_type: scoreTypeId,
        timestamp: Date.now(),
      };

      if (scoreType === 'total') {
        roundData.gross_score = parseInt(grossScore);
        roundData.net_score = calculateNetScore(parseInt(grossScore));
        if (Object.values(manualStats).some(v => v !== '')) {
          roundData.manual_stats = Object.fromEntries(
            Object.entries(manualStats).map(([k, v]) => [k, v ? parseInt(v) : 0])
          );
        }
      } else {
        roundData.hole_scores = holeScores.map(hs => ({
          hole: hs.hole,
          score: hs.strokes,
          putts: hs.putts,
          fairway_hit: hs.fairway_hit,
          gir: hs.gir,
        }));
      }

      // Check if online
      if (syncManager.isNetworkAvailable()) {
        // Save directly to API
        const response = await api.post('/rounds/', roundData);

        // Calculate stats if hole-by-hole
        if (scoreType === 'hole_by_hole') {
          await api.post('/stats/calculate_from_round/', {
            round_id: response.data.id,
          });
        } else if (roundData.manual_stats) {
          await api.post('/stats/', {
            round: response.data.id,
            ...roundData.manual_stats,
          });
        }

        // Clear active round
        await ActiveRoundStorage.clearActiveRound();

        Alert.alert('Success', 'Round saved successfully!');
      } else {
        // Save to sync queue for later
        await syncManager.addToSyncQueue('round', roundData);

        // Save to pending rounds
        const pendingRounds = await OfflineStorage.getPendingRounds();
        pendingRounds.push(roundData);
        await OfflineStorage.setPendingRounds(pendingRounds);

        // Clear active round
        await ActiveRoundStorage.clearActiveRound();

        Alert.alert(
          'Saved Offline',
          'Round saved locally and will sync when connection is restored.'
        );
      }

      router.back();
    } catch (error) {
      console.error('Error saving round:', error);
      Alert.alert('Error', 'Failed to save round');
    } finally {
      setSaving(false);
    }
  };

  if (loadingTees) {
    return <LoadingSpinner message="Loading tees..." />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Progress indicator */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <View key={s} className="flex-row items-center flex-1">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  step >= s ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <Text className={`font-semibold ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                  {s}
                </Text>
              </View>
              {s < 4 && (
                <View className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </View>
          ))}
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-600">Course</Text>
          <Text className="text-xs text-gray-600">Tee</Text>
          <Text className="text-xs text-gray-600">Details</Text>
          <Text className="text-xs text-gray-600">Score</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {step === 1 && (
          <View className="p-4">
            <Card>
              <Text className="text-xl font-bold text-gray-900 mb-4">Search for Course</Text>

              <Input
                placeholder="Enter course name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchCourses}
              />

              <Button
                title={searching ? 'Searching...' : 'Search'}
                onPress={searchCourses}
                loading={searching}
                disabled={searching || !searchQuery.trim()}
              />

              {recentCourses.length > 0 && searchResults.length === 0 && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">Recent Courses</Text>
                  {recentCourses.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      onPress={() => selectCourse(course)}
                      className="p-4 bg-gray-50 rounded-lg mb-2"
                    >
                      <Text className="font-medium text-gray-900">{course.name}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {course.city}, {course.state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searchResults.length > 0 && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">Search Results</Text>
                  {searchResults.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      onPress={() => selectCourse(course)}
                      className="p-4 bg-gray-50 rounded-lg mb-2"
                    >
                      <Text className="font-medium text-gray-900">{course.name}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {course.city}, {course.state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          </View>
        )}

        {step === 2 && (
          <View className="p-4">
            <Card>
              <Text className="text-xl font-bold text-gray-900 mb-4">Select Tee</Text>
              <Text className="text-sm text-gray-600 mb-4">{selectedCourse?.name}</Text>

              {tees.map((tee) => (
                <TouchableOpacity
                  key={tee.id}
                  onPress={() => selectTee(tee)}
                  className="p-4 bg-gray-50 rounded-lg mb-3"
                >
                  <Text className="font-semibold text-gray-900">{tee.name}</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Rating: {tee.rating} | Slope: {tee.slope}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Par: {tee.par}
                  </Text>
                </TouchableOpacity>
              ))}

              <Button
                title="← Back to Course Search"
                onPress={() => setStep(1)}
                variant="text"
                style={{ marginTop: 8 }}
              />
            </Card>
          </View>
        )}

        {step === 3 && (
          <View className="p-4">
            <Card>
              <Text className="text-xl font-bold text-gray-900 mb-4">Round Details</Text>

              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-3">Score Entry Method</Text>

              <TouchableOpacity
                onPress={() => selectScoreType('hole_by_hole')}
                className="p-4 bg-green-50 border-2 border-green-600 rounded-lg mb-3"
              >
                <Text className="font-semibold text-gray-900">Hole-by-Hole (Recommended)</Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Track every shot with detailed stats
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectScoreType('total')}
                className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg mb-3"
              >
                <Text className="font-semibold text-gray-900">Total Score Only</Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Quick entry with optional manual stats
                </Text>
              </TouchableOpacity>

              <Button
                title="← Back to Tee Selection"
                onPress={() => setStep(2)}
                variant="text"
                style={{ marginTop: 8 }}
              />
            </Card>
          </View>
        )}

        {step === 4 && scoreType === 'hole_by_hole' && holes[currentHoleIndex] && (
          <View className="p-4">
            <Card>
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900 text-center">
                  Hole {holes[currentHoleIndex].hole_number} of {holes.length}
                </Text>
                <Text className="text-sm text-gray-600 text-center mt-1">
                  Par {holes[currentHoleIndex].par} • {holes[currentHoleIndex].distance} yards
                </Text>
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-2">Strokes</Text>
              <View className="flex-row flex-wrap mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => updateHoleScore('strokes', num)}
                    className={`w-[22%] m-1 p-4 rounded-lg ${
                      holeScores[currentHoleIndex]?.strokes === num
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center text-xl font-bold ${
                        holeScores[currentHoleIndex]?.strokes === num
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-2">Putts</Text>
              <View className="flex-row flex-wrap mb-4">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => updateHoleScore('putts', num)}
                    className={`w-[30%] m-1 p-4 rounded-lg ${
                      holeScores[currentHoleIndex]?.putts === num
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-center text-xl font-bold ${
                        holeScores[currentHoleIndex]?.putts === num
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {holes[currentHoleIndex].par !== 3 && (
                <TouchableOpacity
                  onPress={() =>
                    updateHoleScore('fairway_hit', !holeScores[currentHoleIndex]?.fairway_hit)
                  }
                  className={`p-4 rounded-lg mb-2 ${
                    holeScores[currentHoleIndex]?.fairway_hit ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      holeScores[currentHoleIndex]?.fairway_hit ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {holeScores[currentHoleIndex]?.fairway_hit ? '✓' : ''} Fairway Hit
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => updateHoleScore('gir', !holeScores[currentHoleIndex]?.gir)}
                className={`p-4 rounded-lg mb-4 ${
                  holeScores[currentHoleIndex]?.gir ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    holeScores[currentHoleIndex]?.gir ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {holeScores[currentHoleIndex]?.gir ? '✓' : ''} Green in Regulation
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-2">
                <Button
                  title="← Previous"
                  onPress={previousHole}
                  variant="secondary"
                  disabled={currentHoleIndex === 0}
                  style={{ flex: 1 }}
                />
                {currentHoleIndex < holes.length - 1 ? (
                  <Button
                    title="Next →"
                    onPress={nextHole}
                    disabled={holeScores[currentHoleIndex]?.strokes === 0}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    title="Review & Save"
                    onPress={handleSave}
                    loading={saving}
                    disabled={holeScores.some(s => s.strokes === 0) || saving}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </Card>
          </View>
        )}

        {step === 4 && scoreType === 'total' && (
          <View className="p-4">
            <Card>
              <Text className="text-xl font-bold text-gray-900 mb-4">Enter Total Score</Text>

              <Input
                label="Gross Score"
                placeholder="Enter your gross score"
                value={grossScore}
                onChangeText={setGrossScore}
                keyboardType="numeric"
              />

              {grossScore && (
                <Text className="text-sm text-gray-600 mb-4">
                  Net Score: {calculateNetScore(parseInt(grossScore))}
                </Text>
              )}

              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Optional Statistics
              </Text>

              <Input
                label="Fairways Hit (out of 14)"
                placeholder="0-14"
                value={manualStats.fairways_hit}
                onChangeText={(val) => setManualStats({ ...manualStats, fairways_hit: val })}
                keyboardType="numeric"
              />

              <Input
                label="Greens in Regulation (out of 18)"
                placeholder="0-18"
                value={manualStats.greens_in_regulation}
                onChangeText={(val) =>
                  setManualStats({ ...manualStats, greens_in_regulation: val })
                }
                keyboardType="numeric"
              />

              <Input
                label="Total Putts"
                placeholder="Total putts"
                value={manualStats.total_putts}
                onChangeText={(val) => setManualStats({ ...manualStats, total_putts: val })}
                keyboardType="numeric"
              />

              <View className="flex-row gap-2 mt-4">
                <Button
                  title="← Back"
                  onPress={() => setStep(3)}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Round"
                  onPress={handleSave}
                  loading={saving}
                  disabled={!grossScore || saving}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
