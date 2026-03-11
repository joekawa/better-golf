import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

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

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRounds, setRecentRounds] = useState<RecentRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, roundsRes] = await Promise.all([
          api.get('/rounds/stats_summary/'),
          api.get('/rounds/recent/?limit=5')
        ]);
        console.log('=== DASHBOARD STATS DEBUG ===');
        console.log('Stats API Response:', statsRes.data);
        console.log('Stats state will be set to:', statsRes.data);
        console.log('avg_score value:', statsRes.data?.avg_score);
        console.log('average_score value:', statsRes.data?.average_score);
        console.log('=== END DASHBOARD STATS DEBUG ===');
        setStats(statsRes.data);
        setRecentRounds(roundsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile?.display_name || profile?.user.username}
        </h1>
        <p className="text-gray-600 mt-2">
          Handicap Index: {profile?.handicap_index ? profile.handicap_index : '20.0'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Rounds</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.total_rounds || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Average Score</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.average_score?.toFixed(1) || '-'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Best Score</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {stats?.best_score || '-'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Worst Score</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {stats?.worst_score || '-'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Rounds</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentRounds.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No rounds yet. Start tracking your golf game!
            </div>
          ) : (
            recentRounds.map((round) => (
              <div key={round.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{round.course_name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {round.date} • {round.score_type_display}
                    </div>
                    {round.stats ? (
                      <div className="text-xs text-gray-500 mt-1">
                        Eagles: {round.stats.eagles} | Birdies: {round.stats.birdies} | Pars: {round.stats.pars} | Bogeys: {round.stats.bogeys} | Dbl: {round.stats.double_bogeys} | FIR: {round.stats.fairways_hit}/14 | GIR: {round.stats.greens_in_regulation}/18 | Putts: {round.stats.total_putts}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        No stats saved for this round
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {round.gross_score}
                    </div>
                    <div className="text-sm text-gray-500">
                      Net: {round.net_score}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
