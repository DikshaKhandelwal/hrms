import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const ApprovalsPanel: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile?.department_id) {
      setRequests([]);
      setLoading(false);
      return;
    }
    try {
      const members = await supabase.from('profiles').select('id').eq('department_id', profile.department_id);
      const memberIds = (members.data || []).map((m: any) => m.id);
      if (memberIds.length === 0) {
        setRequests([]);
      } else {
        const res = await supabase.from('leave_requests').select('id, employee_id, leave_type, start_date, end_date, total_days, reason, status').in('employee_id', memberIds).eq('status', 'pending').order('applied_date', { ascending: false });
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('leave-request-updated', h as EventListener);
    return () => window.removeEventListener('leave-request-updated', h as EventListener);
  }, [profile?.department_id]);

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('leave_requests').update({ status: decision, approved_by: profile?.id, approval_date: now }).eq('id', id);
      if (error) throw error;
      load();
      window.dispatchEvent(new Event('leave-request-updated'));
    } catch (err) {
      console.error('Failed to update decision', err);
      alert('Failed to update approval');
    }
  };

  if (loading) return <div className="p-6">Loading approvals...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Approvals</h2>
      {requests.length === 0 ? (
        <div className="bg-white rounded p-4 border">No pending approvals.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white p-4 border rounded flex items-start justify-between">
              <div>
                <div className="font-medium">{r.leave_type} — {r.total_days} day(s)</div>
                <div className="text-xs text-slate-600">{new Date(r.start_date).toLocaleDateString()} — {new Date(r.end_date).toLocaleDateString()}</div>
                {r.reason && <div className="text-sm mt-2">Reason: {r.reason}</div>}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => decide(r.id, 'approved')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={() => decide(r.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPanel;
