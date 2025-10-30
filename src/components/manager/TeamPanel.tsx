import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TeamPanel: React.FC = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) {
        setMembers([]);
        setLoading(false);
        return;
      }
      try {
        const res = await supabase.from('profiles').select('id, full_name, email, job_title').eq('department_id', profile.department_id).order('full_name');
        setMembers(res.data || []);
      } catch (err) {
        console.error('Failed to load team members', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.department_id]);

  if (loading) return <div className="p-6">Loading team...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Team</h2>
      {!profile?.department_id ? (
        <div className="text-sm text-amber-900 bg-amber-50 p-4 rounded">You don't have a department assigned yet.</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded p-4 border">No team members found.</div>
      ) : (
        <div className="bg-white rounded p-4 border">
          <ul className="space-y-3">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.full_name}</div>
                  <div className="text-xs text-slate-500">{m.job_title} • {m.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;
