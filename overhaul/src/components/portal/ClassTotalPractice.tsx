'use client';

import { useEffect, useState } from 'react';

interface ClassTotalPracticeProps {
  studentId: string;
}

export default function ClassTotalPractice({ studentId }: ClassTotalPracticeProps) {
  const [totalPractices, setTotalPractices] = useState<number>(0);
  const [milestone, setMilestone] = useState<number>(500);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClassTotal() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/student/class-total?studentId=${studentId}`);

        if (response.status === 403) {
          setError('Class total access requires opt-in');
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch class total: ${response.status}`);
        }

        const data = await response.json();
        setTotalPractices(data.total_practices || 0);
        setMilestone(data.milestone || 500);
      } catch (err) {
        console.error('Error fetching class total:', err);
        setError('Failed to load class total');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchClassTotal();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const percent = milestone > 0 ? Math.min(100, Math.round((totalPractices / milestone) * 100)) : 0;
  const reachedGoal = totalPractices >= milestone;

  return (
    <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🎸</span>
        Class Practice Total
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Every practice logged by the class, all-time.
      </p>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-3xl font-bold text-green-600">
          {totalPractices.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">
          goal: {milestone.toLocaleString()}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-green-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 text-center mt-4">
        {reachedGoal
          ? '🎉 Goal reached! Keep practicing while a new goal is set.'
          : `${percent}% of the way to ${milestone.toLocaleString()} practices!`}
      </p>
    </div>
  );
}
