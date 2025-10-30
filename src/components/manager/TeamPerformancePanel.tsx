import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TeamPerformancePanel: React.FC = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) {
        setSummary(null);
        return;
      }
      try {
        const members = await supabase.from('profiles').select('id').eq('department_id', profile.department_id);
        const ids = (members.data || []).map((m: any) => m.id);
        if (ids.length === 0) {
          setSummary({ avgRating: null, total: 0 });
          return;
        }
        const reviews = await supabase.from('performance_reviews').select('rating').in('employee_id', ids);
        const ratings = (reviews.data || []).map((r: any) => r.rating || 0);
        const avg = ratings.length ? (ratings.reduce((a,b) => a + b, 0) / ratings.length).toFixed(1) : null;
        setSummary({ avgRating: avg, total: ids.length });
      } catch (err) {
        console.error('Failed to load team performance', err);
        setSummary(null);
      }
    };
    load();
  }, [profile?.department_id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Team Performance</h2>
      {!summary ? (
        <div className="bg-white p-4 border rounded">No data available.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-slate-500">Avg Rating</div>
            <div className="text-2xl font-bold">{summary.avgRating ?? '—'}</div>
          </div>
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-slate-500">Team Size</div>
            <div className="text-2xl font-bold">{summary.total}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPerformancePanel;
