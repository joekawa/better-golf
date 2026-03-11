import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

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

export const RoundsList: React.FC = () => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const response = await api.get('/rounds/');
        setRounds(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch rounds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading rounds...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Rounds</h1>
        <button
          onClick={() => navigate('/rounds/add')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Round
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {rounds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No rounds yet. Create your first round to start tracking!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rounds.map((round) => (
              <div
                key={round.id}
                onClick={() => navigate(`/rounds/${round.id}`)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
              >
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
