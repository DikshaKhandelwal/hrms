import React from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { RecruiterDashboard } from './RecruiterDashboard';
import TeamPanel from '../manager/TeamPanel';
import ApprovalsPanel from '../manager/ApprovalsPanel';
import ManagerAttendance from '../manager/ManagerAttendance';
import PerformancePanel from '../manager/PerformancePanel';
import AnalyticsPanel from '../manager/AnalyticsPanel';
import RecruitmentPipeline from '../manager/RecruitmentPipeline';
import TeamPerformancePanel from '../manager/TeamPerformancePanel';
import RoleManagementPanel from '../manager/RoleManagementPanel';
import GoalKPIManagement from '../manager/GoalKPIManagement';
import AuditLogsPanel from '../manager/AuditLogsPanel';

// ManagerDashboard: render manager-specific pages when requested, otherwise reuse RecruiterDashboard
export const ManagerDashboard: React.FC<{ activeView?: string }> = ({ activeView = 'dashboard' }) => {
  // Ensure manager-level dashboards react to realtime changes and propagate
  // in-page events so nested components refresh as needed.
  useRealtime(
    () => {
      // notify nested components that attendance changed
      try {
        window.dispatchEvent(new Event('attendance-updated'));
      } catch (err) {
        /* ignore */
      }
    },
    () => {
      try {
        window.dispatchEvent(new Event('leave-request-updated'));
      } catch (err) {
        /* ignore */
      }
    }
  );
  switch (activeView) {
    case 'team':
      return <TeamPanel />;
    case 'approvals':
      return <ApprovalsPanel />;
    case 'attendance':
      return <ManagerAttendance />;
    case 'performance':
      return <PerformancePanel />;
    case 'recruitment-pipeline':
      return <RecruitmentPipeline />;
    case 'team-performance':
      return <TeamPerformancePanel />;
    case 'role-management':
      return <RoleManagementPanel />;
    case 'goal-kpi':
      return <GoalKPIManagement />;
    case 'audit-logs':
      return <AuditLogsPanel />;
    case 'analytics':
      return <AnalyticsPanel />;
    default:
      return <RecruiterDashboard activeView={activeView} />;
  }
};
