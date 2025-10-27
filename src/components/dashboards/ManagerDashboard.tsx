import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    avgPerformance: 0,
    pendingReviews: 0,
    attritionRisk: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [profile?.department_id]);

  const loadTeamData = async () => {
    if (!profile?.department_id) return;

    try {
      const [membersRes, reviewsRes, predictionsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('department_id', profile.department_id),
        supabase.from('performance_reviews').select('rating').eq('status', 'completed'),
        supabase.from('attrition_predictions').select('risk_level').in('risk_level', ['high', 'critical'])
      ]);

      const avgRating = reviewsRes.data?.length
        ? reviewsRes.data.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsRes.data.length
        : 0;

      setTeamStats({
        totalMembers: membersRes.count || 0,
        avgPerformance: Number(avgRating.toFixed(1)),
        pendingReviews: 3,
        attritionRisk: predictionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Management Dashboard</h1>
        <p className="text-slate-600 mt-1">Monitor and manage your department's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Members"
          value={teamStats.totalMembers}
          icon={Users}
          iconColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Avg Performance"
          value={teamStats.avgPerformance || 'N/A'}
          icon={TrendingUp}
          iconColor="bg-green-50 text-green-600"
        />
        <StatCard
          title="Pending Reviews"
          value={teamStats.pendingReviews}
          icon={Calendar}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="At Risk Employees"
          value={teamStats.attritionRisk}
          icon={AlertTriangle}
          iconColor="bg-red-50 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Performance Distribution</h3>
          <div className="space-y-4">
            {[
              { rating: '5 - Excellent', count: 8, percentage: 32 },
              { rating: '4 - Good', count: 12, percentage: 48 },
              { rating: '3 - Average', count: 4, percentage: 16 },
              { rating: '2 - Below Average', count: 1, percentage: 4 },
              { rating: '1 - Poor', count: 0, percentage: 0 },
            ].map((item) => (
              <div key={item.rating}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{item.rating}</span>
                  <span className="text-sm text-slate-600">{item.count} members</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-slate-900 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">On Time</p>
                <p className="text-2xl font-bold text-green-900 mt-1">92%</p>
              </div>
              <div className="text-green-600">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Present Today</p>
                <p className="text-xl font-bold text-slate-900">23/25</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">On Leave</p>
                <p className="text-xl font-bold text-slate-900">2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Team Insights</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Training Recommendation</p>
                <p className="text-xs text-blue-700 mt-1">
                  4 team members would benefit from advanced TypeScript training to improve code quality
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Workload Alert</p>
                <p className="text-xs text-amber-700 mt-1">
                  2 engineers showing signs of burnout. Consider workload redistribution
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">High Performers</p>
                <p className="text-xs text-green-700 mt-1">
                  3 team members consistently exceeding targets. Good candidates for promotion
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Productivity Trend</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[
            { week: 'W1', productivity: 85 },
            { week: 'W2', productivity: 88 },
            { week: 'W3', productivity: 82 },
            { week: 'W4', productivity: 90 },
            { week: 'W5', productivity: 87 },
            { week: 'W6', productivity: 92 },
          ].map((data) => (
            <div key={data.week} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center mb-2" style={{ height: '200px' }}>
                <div
                  className="w-full bg-slate-900 rounded-t hover:bg-slate-700 transition cursor-pointer"
                  style={{ height: `${data.productivity}%` }}
                  title={`Productivity: ${data.productivity}%`}
                ></div>
              </div>
              <span className="text-xs text-slate-600">{data.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
