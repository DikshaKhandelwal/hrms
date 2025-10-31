# Cross-Dashboard Data Integration Documentation

## Overview
This document explains how data flows between different user roles (Employee, Manager, Admin, HR, Recruiter) in the HRMS system, enabling hierarchical visibility and real-time data synchronization.

## Architecture

### 1. **Centralized Data Service** (`src/lib/dashboardService.ts`)
A comprehensive TypeScript service that provides role-based data access:

#### Key Functions:
- **Employee Management**
  - `getAllEmployees()` - Fetch all employees (Admin only)
  - `getEmployeesByDepartment(departmentId)` - Get team members (Manager/Admin)
  - `getEmployeeById(employeeId)` - Get individual employee details
  - `getEmployeeStats(employeeId)` - Comprehensive employee statistics

- **Attendance Tracking**
  - `getEmployeeAttendance(employeeId, startDate?, endDate?)` - Individual attendance records
  - `getAllAttendance(startDate?, endDate?)` - Company-wide attendance (Admin/Manager)

- **Leave Management**
  - `getEmployeeLeaves(employeeId)` - Employee's leave history
  - `getPendingLeaves()` - All pending leave requests (Manager/Admin)
  - `getAllLeaves()` - Complete leave history (Admin)
  - `approveLeaveRequest(leaveId, approverId)` - Approve leave
  - `rejectLeaveRequest(leaveId, approverId)` - Reject leave

- **Performance & Payroll**
  - `getEmployeePerformance(employeeId)` - Performance review history
  - `getEmployeePayroll(employeeId)` - Payroll records

- **Aggregated Stats**
  - `getAllEmployeeStats()` - Stats for all employees (Admin)
  - `getTeamStats(departmentId)` - Stats for team (Manager)

### 2. **Shared UI Components**

#### **EmployeeCard** (`src/components/shared/EmployeeCard.tsx`)
Reusable employee information card displaying:
- Employee name, position, avatar
- Attendance rate with color coding (green ≥90%, amber 75-89%, red <75%)
- Quick stats: Present days, Pending leaves, Performance rating
- Optional detailed view with contact info and additional metrics

**Props:**
```typescript
interface EmployeeCardProps {
  stats: EmployeeStats;
  onClick?: () => void;
  showDetails?: boolean;
}
```

#### **LeaveApprovalDashboard** (`src/components/shared/LeaveApprovalDashboard.tsx`)
Centralized leave approval interface for Admins and Managers:
- View pending/all leave requests
- Employee information with each request
- Approve/Reject actions with real-time updates
- Summary statistics (pending, approved, rejected counts)
- Date range display and reason visibility

### 3. **Role-Specific Dashboard Components**

#### **Admin Dashboard** (`src/components/dashboards/AdminDashboard.tsx`)
**Can Access:**
- Employee Overview (all employees across organization)
- Leave Approval Dashboard (all pending requests)
- All Manager views (team, approvals, performance, etc.)
- All Recruiter views (candidates, AI screening, analytics)
- All Employee views (profile, attendance, leaves)
- Company-wide statistics and insights

**New Views:**
- `employees` → EmployeeOverview component
- `approvals` → LeaveApprovalDashboard
- Delegates to other role dashboards for specific views

#### **EmployeeOverview** (`src/components/admin/EmployeeOverview.tsx`)
Admin-specific view showing:
- Total employees, average attendance, active workers, pending leaves
- Filterable employee list (all, active, on-leave, low-attendance)
- Search by name, email, or role
- Grid of employee cards with full details
- Real-time statistics

#### **Manager Dashboard** (`src/components/dashboards/ManagerDashboard.tsx`)
**Can Access:**
- Team Overview (department members only)
- Leave Approval Dashboard (team leave requests)
- Team performance metrics
- Team attendance tracking
- Recruitment pipeline for team positions

**New Views:**
- `team-overview` → TeamOverview component
- `approvals` → LeaveApprovalDashboard (filtered to team)

#### **TeamOverview** (`src/components/manager/TeamOverview.tsx`)
Manager-specific view showing:
- Team member count, avg attendance, active members, pending approvals
- Filterable team list (all, active, on-leave, needs attention)
- Grid of team member cards with full details
- Department-scoped statistics

#### **Employee Dashboard** (`src/components/dashboards/EmployeeDashboard.tsx`)
**Can Access:**
- Personal stats only (attendance, leaves, performance, payroll)
- Quick actions (mark attendance, request leave, view payslips)
- Own profile and history
- Real-time updates when data changes

## Data Flow

### Hierarchical Access Control

```
┌─────────────────────────────────────────────────────┐
│                      ADMIN                           │
│  ✓ View ALL employees across organization           │
│  ✓ Approve/reject ALL leave requests                │
│  ✓ Access ALL dashboards (Manager, Recruiter, Emp)  │
│  ✓ Company-wide analytics and insights              │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐    ┌────────▼──────────┐
│      MANAGER       │    │     RECRUITER      │
│  ✓ Team members    │    │  ✓ Candidates      │
│  ✓ Team leaves     │    │  ✓ AI screening    │
│  ✓ Team performance│    │  ✓ Analytics       │
│  ✓ Team attendance │    │  ✓ Job postings    │
└─────────┬──────────┘    └────────────────────┘
          │
    ┌─────▼─────┐
    │  EMPLOYEE │
    │  ✓ Own    │
    │    data   │
    │    only   │
    └───────────┘
```

### Real-Time Synchronization

The system uses multiple layers of real-time updates:

1. **Supabase Realtime** (`useRealtime` hook)
   - Database-level subscriptions to `attendance` and `leave_requests` tables
   - Automatically refreshes dashboard when data changes in database
   - Works across different browser sessions

2. **Window Events**
   - `attendance-updated` event
   - `leave-request-updated` event
   - In-app communication between components
   - Immediate UI updates without page refresh

3. **Example Flow:**
```
Employee marks attendance
    ↓
Database updated
    ↓
Supabase broadcasts change
    ↓
Manager Dashboard receives event → Refreshes team attendance
    ↓
Admin Dashboard receives event → Refreshes employee overview
```

## Implementation Examples

### Admin Views All Employees
```typescript
// Admin clicks "Employees" in sidebar
// App.tsx → AdminDashboard (activeView='employees')
// AdminDashboard renders EmployeeOverview
// EmployeeOverview calls getAllEmployeeStats()
// Displays all employees with full stats
```

### Manager Views Team
```typescript
// Manager clicks "Team Overview" in sidebar
// App.tsx → ManagerDashboard (activeView='team-overview')
// ManagerDashboard renders TeamOverview
// TeamOverview calls getTeamStats(manager.department_id)
// Displays only team members with stats
```

### Leave Approval Workflow
```typescript
// Employee submits leave request → Database insert
// Manager opens "Approvals" tab
// LeaveApprovalDashboard calls getPendingLeaves()
// Shows leave with employee details
// Manager clicks "Approve"
// approveLeaveRequest() updates database
// Real-time event triggers refresh on Employee dashboard
// Employee sees "Approved" status immediately
```

## Database Tables Involved

- **profiles** - Employee information
- **attendance** - Daily attendance records
- **leave_requests** - Leave applications with approval status
- **performance_reviews** - Performance ratings and feedback
- **payroll** - Salary and payment information
- **departments** - Department organization

## Security & Permissions

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Employees can only see/edit their own data
- Managers can see their team's data
- Admins can see all data

### Service Layer Validation
`dashboardService.ts` respects RLS policies and provides additional business logic validation.

## Key Features

✅ **Hierarchical Data Access** - Each role sees appropriate level of detail
✅ **Real-Time Updates** - Changes propagate immediately across dashboards
✅ **Reusable Components** - EmployeeCard, LeaveApproval work across all contexts
✅ **Role-Based Filtering** - Automatic data scoping based on user role
✅ **Comprehensive Stats** - Aggregated metrics for all levels
✅ **Search & Filter** - Easy navigation through large employee lists
✅ **Action Buttons** - Approve/reject leaves directly from dashboard
✅ **Visual Indicators** - Color-coded attendance rates and status badges

## Usage Instructions

### For Admins:
1. Navigate to "Employees" to see all employees
2. Use filters (All, Active, On Leave, Low Attendance) to find specific groups
3. Search by name, email, or role
4. Click "Approvals" to manage all pending leave requests
5. Access any manager or employee view to troubleshoot

### For Managers:
1. Navigate to "Team Overview" to see your team members
2. Use filters to identify team members needing attention
3. Click "Approvals" to manage team leave requests
4. Monitor team attendance and performance

### For Employees:
1. Dashboard shows personal stats automatically
2. Use "Quick Actions" to mark attendance or request leave
3. View your own performance reviews and payslips
4. All data updates in real-time

## Extension Points

To add new cross-dashboard features:

1. **Add new data function** in `dashboardService.ts`
2. **Create shared component** in `src/components/shared/`
3. **Add route** in Admin/Manager dashboards
4. **Update sidebar** menu items
5. **Test role-based access** for each user type

## Testing Checklist

- [ ] Admin can see all employees
- [ ] Manager sees only team members
- [ ] Employee sees only own data
- [ ] Leave approval updates in real-time
- [ ] Attendance changes reflect immediately
- [ ] Search and filters work correctly
- [ ] Color coding shows correct status
- [ ] Action buttons (approve/reject) work
- [ ] Statistics calculate correctly
- [ ] RLS policies prevent unauthorized access
