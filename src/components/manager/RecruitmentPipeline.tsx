import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const RecruitmentPipeline: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await supabase.from('candidates').select('id, full_name, email, position_applied, status').order('created_at', { ascending: false }).limit(20);
        setCandidates(res.data || []);
      } catch (err) {
        console.error('Failed to load candidates', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading recruitment pipeline...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Recruitment Pipeline</h2>
      {candidates.length === 0 ? (
        <div className="bg-white p-4 border rounded">No candidates found.</div>
      ) : (
        <div className="bg-white p-4 border rounded">
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-xs text-slate-500">{c.position_applied} • {c.email}</div>
                </div>
                <div className="text-sm text-slate-600">{c.status}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecruitmentPipeline;
