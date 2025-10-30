import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const PerformancePanel: React.FC = () => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) {
        setReviews([]);
        setLoading(false);
        return;
      }
      try {
        // get team members
        const members = await supabase.from('profiles').select('id').eq('department_id', profile.department_id);
        const memberIds = (members.data || []).map((m: any) => m.id);
        if (memberIds.length === 0) {
          setReviews([]);
        } else {
          const res = await supabase.from('performance_reviews').select('id, employee_id, rating, review_period, overall_comments').in('employee_id', memberIds).order('review_date', { ascending: false }).limit(20);
          setReviews(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load performance reviews', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.department_id]);

  if (loading) return <div className="p-6">Loading performance...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Performance</h2>
      {reviews.length === 0 ? (
        <div className="bg-white p-4 border rounded">No recent reviews found.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Rating: {r.rating ?? '—'}</div>
                  <div className="text-xs text-slate-500">Period: {r.review_period}</div>
                </div>
                <div className="text-sm text-slate-600">Employee: {r.employee_id}</div>
              </div>
              {r.overall_comments && <div className="mt-2 text-sm">{r.overall_comments}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
