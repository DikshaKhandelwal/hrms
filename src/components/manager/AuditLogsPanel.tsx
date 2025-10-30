import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const AuditLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // try to read an audit_logs table if present
        const res = await supabase.from('audit_logs').select('id, event, actor_id, created_at').order('created_at', { ascending: false }).limit(50);
        if (res.error) {
          // table may not exist or permission denied
          console.warn('audit_logs query error:', res.error.message);
          setLogs([]);
        } else {
          setLogs(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load audit logs', err);
        setLogs([]);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
      {logs.length === 0 ? (
        <div className="bg-white p-4 border rounded">No audit logs found or audit_logs table missing.</div>
      ) : (
        <div className="bg-white p-4 border rounded space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="text-sm text-slate-700">
              <div className="font-medium">{l.event}</div>
              <div className="text-xs text-slate-500">By: {l.actor_id} • {new Date(l.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
