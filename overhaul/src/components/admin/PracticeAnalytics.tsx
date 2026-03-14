'use client';

import { useEffect, useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface PracticeAnalyticsRecord {
  student_id: string;
  student_name: string;
  month: number;
  year: number;
  practice_days: number;
}

export default function PracticeAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<PracticeAnalyticsRecord[]>([]);
  const [filteredData, setFilteredData] = useState<PracticeAnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof PracticeAnalyticsRecord>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Track auth state for reliable teacher analytics loading
  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserEmail(user?.email || '');
    };

    loadCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email || '');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch analytics data once auth state is ready
  useEffect(() => {
    async function fetchAnalytics() {
      if (!currentUserEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/analytics/practice?userEmail=${encodeURIComponent(currentUserEmail)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Analytics API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch analytics data');
        }

        const data = await response.json();
        console.log('Analytics data loaded:', data.length, 'records');
        setAnalyticsData(data);
        setFilteredData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [currentUserEmail]);

  // Get unique students for filter dropdown
  const uniqueStudents = Array.from(
    new Set(analyticsData.map(record => record.student_name))
  ).sort();

  // Get unique months and years for filter dropdowns
  const uniqueYears = Array.from(
    new Set(analyticsData.map(record => record.year))
  ).sort((a, b) => b - a);

  const uniqueMonths = Array.from(
    new Set(analyticsData.map(record => record.month))
  ).sort((a, b) => a - b);

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  // Filter data when any filter selection changes
  useEffect(() => {
    let filtered = analyticsData;

    // Filter by student
    if (selectedStudent !== 'all') {
      filtered = filtered.filter(record => record.student_name === selectedStudent);
    }

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(record => record.year === parseInt(selectedYear));
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(record => record.month === parseInt(selectedMonth));
    }

    setFilteredData(filtered);
  }, [selectedStudent, selectedMonth, selectedYear, analyticsData]);

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const handleSort = (field: keyof PracticeAnalyticsRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };



  const getPerformanceColor = (days: number) => {
    if (days >= 20) return 'text-green-600 bg-green-50';
    if (days >= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSortIcon = (field: keyof PracticeAnalyticsRecord) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return sortDirection === 'asc' ? (
      <span className="text-green-600 ml-1">↑</span>
    ) : (
      <span className="text-green-600 ml-1">↓</span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalPracticeDays = sortedData.reduce((sum, record) => sum + record.practice_days, 0);
  const averagePracticeDays = sortedData.length > 0
    ? (totalPracticeDays / sortedData.length).toFixed(1)
    : '0';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Practice Analytics</h2>
            <p className="text-sm text-gray-600">
              Historical practice data across all students and months
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {sortedData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-800">{sortedData.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Total Practice Days</p>
            <p className="text-2xl font-bold text-green-600">{totalPracticeDays}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Average Days/Month</p>
            <p className="text-2xl font-bold text-blue-600">{averagePracticeDays}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Student Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Students</option>
              {uniqueStudents.map((student) => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {sortedData.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>No practice data available yet.</p>
          <p className="text-sm mt-2">Students will appear here once they start logging practice.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('student_name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Student Name {getSortIcon('student_name')}
                  </th>
                  <th
                    onClick={() => handleSort('year')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Year {getSortIcon('year')}
                  </th>
                  <th
                    onClick={() => handleSort('month')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Month {getSortIcon('month')}
                  </th>
                  <th
                    onClick={() => handleSort('practice_days')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Practice Days {getSortIcon('practice_days')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((record, index) => (
                  <tr key={`${record.student_id}-${record.year}-${record.month}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getMonthName(record.month)} ({record.month})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getPerformanceColor(
                          record.practice_days
                        )}`}
                      >
                        {record.practice_days} {record.practice_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                {sortedData.length > 0 && (
                  <tr className="bg-green-50 border-t-2 border-green-200">
                    <td colSpan={3} className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-gray-800">Total Practice Days:</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-green-600 text-white">
                        {totalPracticeDays} {totalPracticeDays === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {sortedData.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Performance Legend:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></span>
              <span className="text-gray-600">≥20 days (Excellent)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-yellow-50 border border-yellow-200 rounded mr-2"></span>
              <span className="text-gray-600">10-19 days (Good)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></span>
              <span className="text-gray-600">&lt;10 days (Needs Improvement)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
