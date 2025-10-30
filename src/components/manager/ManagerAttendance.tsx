import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const ManagerAttendance: React.FC = () => {
  const { profile } = useAuth();
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!profile?.department_id) {
      setPresentCount(null);
      setTotalCount(null);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      // get members in dept
      const membersRes = await supabase.from('profiles').select('id').eq('department_id', profile.department_id);
      const memberIds = (membersRes.data || []).map((m: any) => m.id);
      if (memberIds.length === 0) {
        setPresentCount(0);
        setTotalCount(0);
        return;
      }
      const presentRes = await supabase.from('attendance').select('id', { count: 'exact' }).in('employee_id', memberIds).eq('date', today).eq('status', 'present');
      setPresentCount(presentRes.count ?? 0);
      setTotalCount(memberIds.length);
    } catch (err) {
      console.error('Failed to load manager attendance', err);
      setPresentCount(null);
      setTotalCount(null);
    }
  }, [profile?.department_id]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('attendance-updated', h as EventListener);
    return () => window.removeEventListener('attendance-updated', h as EventListener);
  }, [load]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Attendance</h2>
      {profile?.department_id ? (
        <div className="bg-white p-4 border rounded">
          <div className="text-sm text-slate-600 mb-2">Present Today</div>
          <div className="text-3xl font-bold">{presentCount !== null && totalCount !== null ? `${presentCount}/${totalCount}` : '—'}</div>
        </div>
      ) : (
        <div className="text-sm text-amber-900 bg-amber-50 p-4 rounded">You don't have a department assigned yet.</div>
      )}
    </div>
  );
};

export default ManagerAttendance;
