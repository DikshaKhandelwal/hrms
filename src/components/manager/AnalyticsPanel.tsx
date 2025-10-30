import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const AnalyticsPanel: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) {
        setStats(null);
        return;
      }
      try {
        // simple analytics: headcount and avg rating
        const members = await supabase.from('profiles').select('id').eq('department_id', profile.department_id);
        const memberIds = (members.data || []).map((m: any) => m.id);
        const headcount = memberIds.length;
        let avgRating = null;
        if (memberIds.length > 0) {
          const reviews = await supabase.from('performance_reviews').select('rating').in('employee_id', memberIds);
          const ratings = (reviews.data || []).map((r: any) => r.rating || 0);
          if (ratings.length) avgRating = (ratings.reduce((a,b) => a + b, 0) / ratings.length).toFixed(1);
        }
        setStats({ headcount, avgRating });
      } catch (err) {
        console.error('Failed to load analytics', err);
        setStats(null);
      }
    };
    load();
  }, [profile?.department_id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Analytics</h2>
      {!profile?.department_id ? (
        <div className="text-sm text-amber-900 bg-amber-50 p-4 rounded">You don't have a department assigned yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-slate-500">Headcount</div>
            <div className="text-2xl font-bold">{stats?.headcount ?? '—'}</div>
          </div>
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-slate-500">Avg Rating</div>
            <div className="text-2xl font-bold">{stats?.avgRating ?? '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
