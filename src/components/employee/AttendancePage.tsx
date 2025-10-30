import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
}

export const AttendancePage: React.FC = () => {
    const { profile } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!profile?.id) return setLoading(false);
            try {
                const res = await supabase
                    .from('attendance')
                    .select('id, date, status, check_in, check_out')
                    .eq('employee_id', profile.id)
                    .order('date', { ascending: false });
                if (res.error) throw res.error;
                setRecords(res.data || []);
            } catch (err) {
                console.error('Failed to load attendance', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [profile?.id]);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const markToday = async () => {
        if (!profile?.id) return;
        try {
            // check if already marked
            const check = await supabase
                .from('attendance')
                .select('id')
                .eq('employee_id', profile.id)
                .eq('date', todayStr)
                .maybeSingle();
            if (check.data) {
                // already marked
                return;
            }

            const now = new Date().toISOString();
            const insert = await supabase.from('attendance').insert({
                employee_id: profile.id,
                date: todayStr,
                status: 'present',
                check_in: now,
                check_out: null,
                work_hours: 0,
            });
            if (insert.error) throw insert.error;

            // refresh local list - guard typing for insert.data
            const insertedId = Array.isArray(insert.data) ? String((insert.data as any)[0]?.id ?? 'new') : 'new';
            setRecords((r) => [{ id: insertedId, date: todayStr, status: 'present', check_in: now, check_out: null }, ...r]);

            // notify other components (dashboard/manager)
            window.dispatchEvent(new Event('attendance-updated'));
        } catch (err) {
            console.error('Failed to mark attendance', err);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">My Attendance</h2>
            <div className="mb-4 flex items-center gap-3">
                <button onClick={markToday} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Mark Present (Today)</button>
                <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
            {records.length === 0 ? (
                <div className="bg-white rounded-xl p-6 border border-slate-200">No attendance records found.</div>
            ) : (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="text-sm text-slate-600">
                                <th className="py-2">Date</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Check-in</th>
                                <th className="py-2">Check-out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="py-2 text-sm text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="py-2 text-sm text-slate-700">{r.status}</td>
                                    <td className="py-2 text-sm text-slate-700">{r.check_in || '—'}</td>
                                    <td className="py-2 text-sm text-slate-700">{r.check_out || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
