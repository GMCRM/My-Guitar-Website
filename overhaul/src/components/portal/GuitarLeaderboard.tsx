'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  practice_days: number;
}

interface GuitarLeaderboardProps {
  studentId: string;
}

export default function GuitarLeaderboard({ studentId }: GuitarLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableMonths, setAvailableMonths] = useState<{ month: number; year: number }[]>([]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  // Generate list of months with data (last 12 months)
  useEffect(() => {
    const months: { month: number; year: number }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear()
      });
    }
    
    setAvailableMonths(months);
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/leaderboard?year=${selectedYear}&month=${selectedMonth}&studentId=${studentId}`
        );

        if (response.status === 403) {
          console.log('Leaderboard access denied - not opted in');
          setError('Leaderboard access requires opt-in');
          setLeaderboardData([]);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Leaderboard API error:', response.status, errorText);
          throw new Error(`Failed to fetch leaderboard: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Leaderboard data received:', data);
        setLeaderboardData(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchLeaderboard();
    }
  }, [studentId, selectedMonth, selectedYear]);

  // Calculate ranks with tie handling
  const rankedData = leaderboardData.map((entry, index, array) => {
    let rank = 1;
    
    // Count how many entries before this one have MORE practice days
    for (let i = 0; i < index; i++) {
      if (array[i].practice_days > entry.practice_days) {
        rank++;
      }
    }
    
    return { ...entry, rank };
  });

  // For past months, show only top 3
  const displayData = isCurrentMonth ? rankedData : rankedData.filter(entry => entry.rank <= 3);

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show leaderboard if there's an access error
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
      {/* Header with month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0 flex items-center">
          <span className="mr-2">🏆</span>
          Guitar Practice Leaderboard
        </h2>
        
        <select
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setSelectedYear(parseInt(year));
            setSelectedMonth(parseInt(month));
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {availableMonths.map(({ month, year }) => (
            <option key={`${year}-${month}`} value={`${year}-${month}`}>
              {getMonthName(month)} {year}
            </option>
          ))}
        </select>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-gray-600 mb-4">
        {isCurrentMonth ? (
          <>Showing all students for {getMonthName(selectedMonth)} {selectedYear}</>
        ) : (
          <>Showing top 3 for {getMonthName(selectedMonth)} {selectedYear}</>
        )}
      </p>

      {/* Leaderboard entries */}
      {displayData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No practice data yet for this month.</p>
          <p className="text-sm mt-2">Be the first to start practicing!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayData.map((entry) => {
            const trophy = getTrophyIcon(entry.rank);
            const isCurrentUser = entry.student_id === studentId;
            const displayName = `${entry.first_name} ${entry.last_name}`.trim() || entry.email;

            return (
              <div
                key={entry.student_id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isCurrentUser
                    ? 'bg-green-50 border-green-400'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Rank or Trophy */}
                  <div className="flex items-center justify-center w-12 h-12">
                    {trophy ? (
                      <span className="text-3xl">{trophy}</span>
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Student name */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Practice days */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {entry.practice_days}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.practice_days === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer message */}
      {displayData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Keep practicing to climb the leaderboard! 🎸
          </p>
        </div>
      )}
    </div>
  );
}
