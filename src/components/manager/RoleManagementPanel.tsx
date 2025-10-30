import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const RoleManagementPanel: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // fetch sample profiles and summarize roles client-side
        const sample = await supabase.from('profiles').select('id, full_name, role').limit(500);
        if (sample.error) {
          console.warn('profiles query error:', sample.error.message);
          setRoles([]);
          return;
        }
        const rows = sample.data || [];
        const counts: Record<string, { role: string; count: number; example?: string }> = {};
        rows.forEach((p: any) => {
          const r = p.role || 'employee';
          if (!counts[r]) counts[r] = { role: r, count: 0, example: p.full_name };
          counts[r].count += 1;
        });
        setRoles(Object.values(counts));
      } catch (err) {
        console.error('Failed to load role management data', err);
        setRoles([]);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Role Management</h2>
      <div className="bg-white p-4 border rounded">
        <p className="text-sm text-slate-600">This panel lists roles and example users. Role edits are restricted to admins.</p>
        <div className="mt-4 space-y-2">
          {roles.length === 0 ? (
            <div className="text-sm text-slate-500">No role summary available.</div>
          ) : (
            roles.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="font-medium">{r.role}</div>
                <div className="text-sm text-slate-500">{r.example ?? ''}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagementPanel;
