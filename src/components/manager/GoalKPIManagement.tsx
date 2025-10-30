import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const GoalKPIManagement: React.FC = () => {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Attempt to load goals table if exists
        const res = await supabase.from('goals').select('id, title, owner_id, status').order('created_at', { ascending: false }).limit(50);
        if (res.error) {
          console.warn('goals query error:', res.error.message);
          setGoals([]);
        } else {
          setGoals(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load goals', err);
        setGoals([]);
      }
    };
    load();
  }, [profile?.id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Goal Management</h2>
      {goals.length === 0 ? (
        <div className="bg-white p-4 border rounded">No goals or KPI records found.</div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="bg-white p-4 border rounded">
              <div className="font-medium">{g.title}</div>
              <div className="text-xs text-slate-500">Owner: {g.owner_id} • Status: {g.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalKPIManagement;
