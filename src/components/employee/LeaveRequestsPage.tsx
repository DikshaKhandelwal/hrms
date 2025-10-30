import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveRequest {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
}

export const LeaveRequestsPage: React.FC = () => {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    // store leave_type as user-friendly tokens; we'll map 'paid' -> DB 'vacation' when inserting
    const [form, setForm] = useState({ leave_type: 'paid', start_date: '', end_date: '', reason: '' });

    useEffect(() => {
        const load = async () => {
            if (!profile?.id) return setLoading(false);
            try {
                const res = await supabase
                    .from('leave_requests')
                    .select('id, leave_type, start_date, end_date, total_days, reason, status')
                    .eq('employee_id', profile.id)
                    .order('applied_date', { ascending: false });
                if (res.error) throw res.error;
                setRequests(res.data || []);
            } catch (err) {
                console.error('Failed to load leave requests', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [profile?.id]);

    const applyLeave = async () => {
        if (!profile?.id) return;
        try {
            const { start_date, end_date, leave_type, reason } = form;
            if (!start_date || !end_date) return alert('Please select start and end dates');
            const s = new Date(start_date);
            const e = new Date(end_date);
            const msPerDay = 1000 * 60 * 60 * 24;
            const diffDays = Math.max(1, Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1);
            const applied_date = new Date().toISOString();

            // map user-facing leave types to DB enum tokens
            // DB enum includes 'vacation' for paid leave
            const dbLeaveType = (leave_type === 'paid') ? 'vacation' : (leave_type || '').toString().toLowerCase();

            // request the inserted row back so we can get its id
            const insert = await supabase.from('leave_requests').insert({
                employee_id: profile.id,
                leave_type: dbLeaveType,
                start_date,
                end_date,
                total_days: diffDays,
                reason,
                status: 'pending',
                applied_date,
            }).select();
            if (insert.error) throw insert.error;

            // refresh list - prefer the returned inserted id when available
            const newId = Array.isArray(insert.data) ? String((insert.data as any)[0]?.id ?? 'new') : 'new';
            setRequests((r) => [{ id: String(newId), leave_type: dbLeaveType, start_date, end_date, total_days: diffDays, reason, status: 'pending' }, ...r]);
            setShowForm(false);

            // notify other components
            window.dispatchEvent(new Event('leave-request-updated'));
        } catch (err: any) {
            console.error('Failed to apply leave', err);
            const message = err?.message || String(err);
            alert(`Failed to submit leave request: ${message}`);
        }
    };

    const formatLeaveType = (val?: string) => {
        const v = (val || '').toString().toLowerCase();
        if (v === 'vacation') return 'Paid';
        if (v === 'sick') return 'Sick';
        if (v === 'unpaid') return 'Unpaid';
        if (v === 'casual') return 'Casual';
        if (v === 'maternity') return 'Maternity';
        if (v === 'paternity') return 'Paternity';
        // fallback: capitalize
        return v.charAt(0).toUpperCase() + v.slice(1);
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
            <h2 className="text-2xl font-bold text-slate-900 mb-4">My Leave Requests</h2>
            <div className="mb-4">
                {!showForm ? (
                    <button onClick={() => setShowForm(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Apply for Leave</button>
                ) : (
                    <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select value={form.leave_type} onChange={(e) => setForm(f => ({ ...f, leave_type: e.target.value }))} className="px-3 py-2 border rounded-md">
                                <option value="paid">Paid</option>
                                <option value="sick">Sick</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                            <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className="px-3 py-2 border rounded-md" />
                            <input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} className="px-3 py-2 border rounded-md" />
                        </div>
                        <textarea value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} className="mt-3 w-full px-3 py-2 border rounded-md" placeholder="Reason (optional)" />
                        <div className="mt-3 flex items-center gap-2">
                            <button onClick={applyLeave} className="px-3 py-2 bg-green-600 text-white rounded-md">Submit</button>
                            <button onClick={() => setShowForm(false)} className="px-3 py-2 bg-slate-100 rounded-md">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl p-6 border border-slate-200">No leave requests found.</div>
            ) : (
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                    {requests.map((r) => (
                        <div key={r.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{formatLeaveType(r.leave_type)} — {r.total_days} day(s)</p>
                                    <p className="text-xs text-slate-600">{new Date(r.start_date).toLocaleDateString()} — {new Date(r.end_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-50 text-green-800' : r.status === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                            {r.reason && <p className="mt-2 text-sm text-slate-700">Reason: {r.reason}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaveRequestsPage;
