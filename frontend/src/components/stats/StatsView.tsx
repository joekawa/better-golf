import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AggregateStats {
  total_rounds: number;
  avg_fairways_hit: number;
  avg_gir: number;
  avg_putts: number;
  avg_score: number;
  total_eagles: number;
  total_birdies: number;
  total_pars: number;
  total_bogeys: number;
  total_double_bogeys: number;
  avg_birdies_per_round: number;
  avg_pars_per_round: number;
  avg_bogeys_per_round: number;
  avg_double_bogeys_per_round: number;
  fairway_percentage: number;
  gir_percentage: number;
  putts_per_hole: number;
}

interface ScoreTrend {
  date: string;
  course_name: string;
  net_score: number;
  gross_score: number;
}

interface CourseStatistics {
  unique_courses: number;
  most_played_course: string | null;
  most_played_count: number;
}

export const StatsView: React.FC = () => {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [scoreTrends, setScoreTrends] = useState<ScoreTrend[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundsFilter, setRoundsFilter] = useState<number | 'all'>(10);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        const limitParam = roundsFilter === 'all' ? '' : `?limit=${roundsFilter}`;

        console.log('=== FETCHING STATS ===');
        console.log('Filter:', roundsFilter);
        console.log('Limit param:', limitParam);

        const [aggregateRes, trendsRes, courseRes] = await Promise.all([
          api.get(`/stats/aggregate/${limitParam}`),
          api.get(`/stats/score_trends/${limitParam}`),
          api.get(`/stats/course_statistics/${limitParam}`)
        ]);

        console.log('=== AGGREGATE STATS RESPONSE ===');
        console.log(JSON.stringify(aggregateRes.data, null, 2));

        console.log('=== SCORE TRENDS RESPONSE ===');
        console.log(JSON.stringify(trendsRes.data, null, 2));

        console.log('=== COURSE STATISTICS RESPONSE ===');
        console.log(JSON.stringify(courseRes.data, null, 2));

        setStats(aggregateRes.data);
        setScoreTrends(trendsRes.data);
        setCourseStats(courseRes.data);

        console.log('=== STATE UPDATED ===');
        console.log('Stats state:', aggregateRes.data);
        console.log('Score trends state:', trendsRes.data);
        console.log('Course stats state:', courseRes.data);
      } catch (error) {
        console.error('=== ERROR FETCHING STATS ===');
        console.error('Error details:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown; status?: number } };
          console.error('Error response:', axiosError.response?.data);
          console.error('Error status:', axiosError.response?.status);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [roundsFilter]);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (!stats || stats.total_rounds === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Statistics</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No round data found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setRoundsFilter(10)}
            className={`px-4 py-2 rounded-md font-medium ${
              roundsFilter === 10
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 10
          </button>
          <button
            onClick={() => setRoundsFilter(20)}
            className={`px-4 py-2 rounded-md font-medium ${
              roundsFilter === 20
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 20
          </button>
          <button
            onClick={() => setRoundsFilter(50)}
            className={`px-4 py-2 rounded-md font-medium ${
              roundsFilter === 50
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 50
          </button>
          <button
            onClick={() => setRoundsFilter('all')}
            className={`px-4 py-2 rounded-md font-medium ${
              roundsFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Average Per Round</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avg_birdies_per_round.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Birdies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avg_pars_per_round.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Pars</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avg_bogeys_per_round.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Bogeys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.avg_double_bogeys_per_round.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Double Bogeys</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fairways & Greens</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Fairways Hit</span>
                <span className="text-2xl font-bold text-gray-900">{stats.fairway_percentage.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-gray-500">Avg: {stats.avg_fairways_hit.toFixed(1)} per round</div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Greens in Regulation</span>
                <span className="text-2xl font-bold text-gray-900">{stats.gir_percentage.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-gray-500">Avg: {stats.avg_gir.toFixed(1)} per round</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Statistics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Unique Courses</span>
                <span className="text-2xl font-bold text-gray-900">{courseStats?.unique_courses || 0}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Most Played Course</div>
              <div className="text-lg font-bold text-gray-900">
                {courseStats?.most_played_course || 'N/A'}
              </div>
              {courseStats?.most_played_count ? (
                <div className="text-sm text-gray-500">{courseStats.most_played_count} rounds</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {scoreTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Score Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                        <p className="font-semibold">{data.course_name}</p>
                        <p className="text-sm text-gray-600">{data.date}</p>
                        <p className="text-sm text-green-600">Gross: {data.gross_score}</p>
                        <p className="text-sm text-blue-600">Net: {data.net_score}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gross_score"
                stroke="#10b981"
                name="Gross Score"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="net_score"
                stroke="#3b82f6"
                name="Net Score"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
