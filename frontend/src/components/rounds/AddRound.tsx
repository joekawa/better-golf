import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  external_api_id?: number;
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

export const AddRound: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [tees, setTees] = useState<Tee[]>([]);
  const [selectedTee, setSelectedTee] = useState<Tee | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scoreType, setScoreType] = useState<0 | 1 | null>(null);
  const [scoreTypeId, setScoreTypeId] = useState<number | null>(null);

  const [grossScore, setGrossScore] = useState('');
  const [manualStats, setManualStats] = useState({
    fairways_hit: '',
    greens_in_regulation: '',
    total_putts: '',
    eagles: '',
    birdies: '',
    pars: '',
    bogeys: '',
    double_bogeys: ''
  });

  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoreTypes, setScoreTypes] = useState<Array<{id: number; type: number}>>([]);
  const [pendingHandicap, setPendingHandicap] = useState<{
    current_handicap: number | null;
    pending_handicap: number | null;
    rounds_count: number;
    will_have_handicap: boolean;
    error?: string;
  } | null>(null);
  const [loadingHandicap, setLoadingHandicap] = useState(false);

  useEffect(() => {
    const fetchScoreTypes = async () => {
      try {
        const response = await api.get('/score-types/');
        console.log('Score types response:', response.data);
        const types = Array.isArray(response.data) ? response.data : response.data.results || [];
        console.log('Parsed score types:', types);
        setScoreTypes(types);
      } catch (error) {
        console.error('Error fetching score types:', error);
      }
    };
    fetchScoreTypes();
  }, []);

  const searchCourses = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await api.get(`/courses/search/?q=${searchQuery}`);
      console.log('Search response:', response.data);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectCourse = async (course: Course) => {
    console.log('Selected course:', course);
    setSelectedCourse(course);
    try {
      if (course.external_api_id) {
        console.log(`Course has external_api_id: ${course.external_api_id}. Fetching full details from API...`);
        const saveResponse = await api.post('/courses/save/', {
          course_id: course.external_api_id
        });
        console.log('Course saved with full details:', saveResponse.data);
      }

      console.log(`Fetching tees from: /courses/${course.id}/tees/`);
      const response = await api.get(`/courses/${course.id}/tees/`);
      console.log('Tees API response:', response.data);
      console.log('Number of tees:', response.data?.length || 0);
      setTees(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error fetching tees:', error);
    }
  };

  const selectTee = async (tee: Tee) => {
    setSelectedTee(tee);
    try {
      console.log('Fetching tees for course:', selectedCourse?.id);
      const response = await api.get(`/courses/${selectedCourse?.id}/tees/`);
      console.log('Tees response:', response.data);
      const teeData = response.data.find((t: Tee & { holes?: Hole[] }) => t.id === tee.id);
      console.log('Found tee data:', teeData);
      console.log('Holes in tee data:', teeData?.holes);
      if (teeData && teeData.holes) {
        const sortedHoles = teeData.holes.sort((a: Hole, b: Hole) => a.hole_number - b.hole_number);
        console.log('Setting holes:', sortedHoles);
        setHoles(sortedHoles);
      } else {
        console.warn('No holes found in tee data!');
      }
      setStep(3);
    } catch (error) {
      console.error('Error fetching holes:', error);
    }
  };

  const selectScoreType = (type: 0 | 1) => {
    setScoreType(type);
    const scoreTypeObj = scoreTypes.find(st => st.type === type);
    if (scoreTypeObj) {
      setScoreTypeId(scoreTypeObj.id);
    }
    if (type === 1 && holes.length > 0) {
      console.log('Initializing hole scores with holes:', holes);
      const initialScores = holes.map(hole => ({
        hole: hole.id,
        strokes: 0,
        putts: 0,
        fairway_hit: false,
        gir: false
      }));
      console.log('Initial hole scores:', initialScores);
      setHoleScores(initialScores);
    }
    setStep(4);
  };

  const updateHoleScore = (index: number, field: keyof HoleScore, value: number | boolean) => {
    const updated = [...holeScores];
    updated[index] = { ...updated[index], [field]: value };
    setHoleScores(updated);
  };

  const calculateNetScore = (gross: number): number => {
    if (!profile || !selectedTee) return gross;

    const handicapIndex = parseFloat(profile.handicap_index);
    const slope = selectedTee.slope;

    const courseHandicap = Math.round((handicapIndex * slope) / 113);
    return gross - courseHandicap;
  };

  const calculateGrossFromHoles = (): number => {
    return holeScores.reduce((sum, score) => sum + score.strokes, 0);
  };

  const fetchPendingHandicap = async () => {
    if (!selectedTee) return;

    const grossScoreValue = scoreType === 0
      ? parseInt(grossScore)
      : calculateGrossFromHoles();

    try {
      setLoadingHandicap(true);
      const response = await api.post('/auth/handicap-history/preview/', {
        gross_score: grossScoreValue,
        course_tee_id: selectedTee.id
      });
      setPendingHandicap(response.data);
    } catch (error) {
      console.error('Error fetching pending handicap:', error);
      setPendingHandicap(null);
    } finally {
      setLoadingHandicap(false);
    }
  };

  const handleReview = async () => {
    await fetchPendingHandicap();
    setShowConfirmation(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const roundData: {
        course: number | undefined;
        course_tee: number | undefined;
        date: string;
        score_type: number | null;
        gross_score?: number;
        net_score?: number;
        hole_scores?: Array<{ hole: number; score: number; putts: number; fairway_hit: boolean; gir: boolean }>;
      } = {
        course: selectedCourse?.id,
        course_tee: selectedTee?.id,
        date,
        score_type: scoreTypeId
      };

      if (scoreType === 0) {
        roundData.gross_score = parseInt(grossScore);
        roundData.net_score = calculateNetScore(parseInt(grossScore));
      } else if (scoreType === 1) {
        console.log('Current holeScores state:', holeScores);
        console.log('Available holes:', holes);
        roundData.hole_scores = holeScores.map(hs => ({
          hole: hs.hole,
          score: hs.strokes,
          putts: hs.putts || 0,
          fairway_hit: hs.fairway_hit || false,
          gir: hs.gir || false
        }));
        console.log('Mapped hole_scores for submission:', roundData.hole_scores);
      }

      console.log('Submitting round data:', roundData);

      let roundResponse;
      try {
        roundResponse = await api.post('/rounds/', roundData);
        console.log('=== ROUND CREATED SUCCESSFULLY ===');
        console.log('Full response:', roundResponse);
        console.log('Response data:', roundResponse.data);
        console.log('Round ID:', roundResponse.data?.id);
      } catch (roundError: unknown) {
        console.error('=== ROUND CREATION FAILED ===');
        console.error('Error:', roundError);
        if (axios.isAxiosError(roundError)) {
          console.error('Response data:', roundError.response?.data);
          console.error('Status:', roundError.response?.status);
        }
        throw roundError;
      }

      if (scoreType === 0 && Object.values(manualStats).some(v => v !== '')) {
        await api.post('/stats/', {
          round: roundResponse.data.id,
          ...Object.fromEntries(
            Object.entries(manualStats).map(([k, v]) => [k, v ? parseInt(v) : 0])
          )
        });
      } else if (scoreType === 1) {
        console.log('Calculating stats for round:', roundResponse.data.id);
        await api.post('/stats/calculate_from_round/', {
          round_id: roundResponse.data.id
        });
      }

      navigate('/rounds');
    } catch (error: unknown) {
      console.error('=== ERROR SAVING ROUND ===');
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
        console.error('Status:', error.response?.status);
      }
      alert('Error saving round. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Round</h1>
        <div className="mt-4 flex items-center">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <span>Course</span>
          <span>Tee</span>
          <span>Date & Type</span>
          <span>Score</span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search for Course</h2>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCourses()}
              placeholder="Enter course name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchCourses}
              disabled={searching || !searchQuery.trim()}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Select a Course:</h3>
              {searchResults.map((course) => (
                <button
                  key={course.id}
                  onClick={() => selectCourse(course)}
                  className="w-full text-left p-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <div className="font-semibold text-gray-900">{course.name}</div>
                  <div className="text-sm text-gray-600">
                    {course.city}, {course.state} {course.country}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedCourse && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Select Tee</h2>
          <p className="text-gray-600 mb-4">{selectedCourse.name}</p>

          {tees.length > 0 ? (
            <div className="space-y-2">
              {tees.map((tee) => (
                <button
                  key={tee.id}
                  onClick={() => selectTee(tee)}
                  className="w-full text-left p-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{tee.name} Tees</div>
                      <div className="text-sm text-gray-600">
                        Rating: {tee.rating} | Slope: {tee.slope} | Par: {tee.par}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No tees available for this course.</p>
          )}

          <button
            onClick={() => setStep(1)}
            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Course Search
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Round Details</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Score Type
            </label>
            <div className="space-y-2">
              <button
                onClick={() => selectScoreType(0)}
                className="w-full text-left p-4 border-2 border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-semibold text-gray-900">Total Score</div>
                <div className="text-sm text-gray-600">Enter your total gross score</div>
              </button>
              <button
                onClick={() => selectScoreType(1)}
                className="w-full text-left p-4 border-2 border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="font-semibold text-gray-900">Hole-by-Hole</div>
                <div className="text-sm text-gray-600">Enter score for each hole with detailed stats</div>
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Tee Selection
          </button>
        </div>
      )}

      {step === 4 && scoreType === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Total Score</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Gross Score *
            </label>
            <input
              type="number"
              value={grossScore}
              onChange={(e) => setGrossScore(e.target.value)}
              placeholder="Enter your gross score"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {grossScore && (
              <p className="mt-2 text-sm text-gray-600">
                Net Score: {calculateNetScore(parseInt(grossScore))}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Fairways Hit</label>
                <input
                  type="number"
                  value={manualStats.fairways_hit}
                  onChange={(e) => setManualStats({...manualStats, fairways_hit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  max="14"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Greens in Regulation</label>
                <input
                  type="number"
                  value={manualStats.greens_in_regulation}
                  onChange={(e) => setManualStats({...manualStats, greens_in_regulation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  max="18"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Total Putts</label>
                <input
                  type="number"
                  value={manualStats.total_putts}
                  onChange={(e) => setManualStats({...manualStats, total_putts: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Eagles</label>
                <input
                  type="number"
                  value={manualStats.eagles}
                  onChange={(e) => setManualStats({...manualStats, eagles: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Birdies</label>
                <input
                  type="number"
                  value={manualStats.birdies}
                  onChange={(e) => setManualStats({...manualStats, birdies: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Pars</label>
                <input
                  type="number"
                  value={manualStats.pars}
                  onChange={(e) => setManualStats({...manualStats, pars: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bogeys</label>
                <input
                  type="number"
                  value={manualStats.bogeys}
                  onChange={(e) => setManualStats({...manualStats, bogeys: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Double Bogeys+</label>
                <input
                  type="number"
                  value={manualStats.double_bogeys}
                  onChange={(e) => setManualStats({...manualStats, double_bogeys: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              onClick={handleReview}
              disabled={!grossScore}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Review & Save
            </button>
          </div>
        </div>
      )}

      {step === 4 && scoreType === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Hole-by-Hole Scores</h2>

          <div className="space-y-4 mb-6">
            {holes.map((hole, index) => (
              <div key={hole.id} className="border border-gray-300 rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-bold text-gray-900">Hole {hole.hole_number}</span>
                    <span className="ml-4 text-sm text-gray-600">Par {hole.par}</span>
                    <span className="ml-4 text-sm text-gray-600">{hole.distance} yds</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Strokes *</label>
                    <input
                      type="number"
                      value={holeScores[index]?.strokes || ''}
                      onChange={(e) => updateHoleScore(index, 'strokes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Putts</label>
                    <input
                      type="number"
                      value={holeScores[index]?.putts || ''}
                      onChange={(e) => updateHoleScore(index, 'putts', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                  {hole.par !== 3 && (
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={holeScores[index]?.fairway_hit || false}
                          onChange={(e) => updateHoleScore(index, 'fairway_hit', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-xs text-gray-700">Fairway Hit</span>
                      </label>
                    </div>
                  )}
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={holeScores[index]?.gir || false}
                        onChange={(e) => updateHoleScore(index, 'gir', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-700">GIR</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {holeScores.length > 0 && holeScores.every(s => s.strokes > 0) && (
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Round Summary</h3>
              <p className="text-sm text-gray-600">
                Gross Score: {calculateGrossFromHoles()} |
                Net Score: {calculateNetScore(calculateGrossFromHoles())}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              onClick={handleReview}
              disabled={!holeScores.every(s => s.strokes > 0)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Review & Save
            </button>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Round Details</h2>

            <div className="space-y-2 mb-6 text-sm">
              <p><span className="font-semibold">Course:</span> {selectedCourse?.name}</p>
              <p><span className="font-semibold">Tee:</span> {selectedTee?.name}</p>
              <p><span className="font-semibold">Date:</span> {date}</p>
              <p><span className="font-semibold">Score Type:</span> {scoreType === 0 ? 'Total Score' : 'Hole-by-Hole'}</p>

              {scoreType === 0 && (
                <>
                  <p><span className="font-semibold">Gross Score:</span> {grossScore}</p>
                  <p><span className="font-semibold">Net Score:</span> {calculateNetScore(parseInt(grossScore))}</p>
                </>
              )}

              {scoreType === 1 && (
                <>
                  <p><span className="font-semibold">Gross Score:</span> {calculateGrossFromHoles()}</p>
                  <p><span className="font-semibold">Net Score:</span> {calculateNetScore(calculateGrossFromHoles())}</p>
                </>
              )}

              {loadingHandicap && (
                <p className="text-sm text-gray-500 italic">Calculating handicap...</p>
              )}

              {!loadingHandicap && pendingHandicap && (
                <>
                  {pendingHandicap.error ? (
                    <p className="text-sm text-gray-500 italic">
                      Handicap preview unavailable ({pendingHandicap.error})
                    </p>
                  ) : pendingHandicap.will_have_handicap ? (
                    <p>
                      <span className="font-semibold">Pending Handicap:</span>{' '}
                      {pendingHandicap.current_handicap !== null && (
                        <span className="text-gray-500">{pendingHandicap.current_handicap} → </span>
                      )}
                      <span className="text-blue-600 font-semibold">
                        {pendingHandicap.pending_handicap}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Not enough rounds for handicap (need 5, will have {pendingHandicap.rounds_count + 1})
                    </p>
                  )}
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to save this round?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
