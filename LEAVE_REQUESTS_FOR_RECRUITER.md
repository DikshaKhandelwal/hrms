# ✅ Leave Requests Now Visible for Recruiters

## What's New

I've added a complete **Leave Management View** for recruiters! 🎉

### Features Added:

#### 1. **New Leave Requests Page** (`RecruiterLeaveView.tsx`)
- 📊 Summary stats cards:
  - Total Requests
  - Pending (awaiting approval)
  - Approved
  - Rejected
- 🎯 Filter buttons to view:
  - All requests
  - Pending only
  - Approved only
  - Rejected only
- 📋 Detailed table showing:
  - Employee name & email
  - Leave type (sick, casual, etc.)
  - Start & end dates
  - Total days
  - Status with color-coded badges
  - Reason for leave
- 🔄 Real-time updates when employees apply for leave

#### 2. **Updated Navigation**
- Added **"Leaves"** button in the recruiter header navigation
- Click "Leaves" to view all leave requests

#### 3. **Updated RLS Policies**
- `URGENT_FIX_PROFILES_ACCESS.sql` now fixes BOTH:
  - ✅ Profiles access (for employee names/details)
  - ✅ Leave requests access (for viewing all leave requests)

## How to Enable

### Step 1: Run the SQL Fix
```sql
-- Copy and run: d:\hrms\supabase\URGENT_FIX_PROFILES_ACCESS.sql
-- This will:
-- 1. Add profiles_recruiter_view_all policy
-- 2. Add leave_requests_recruiter_view policy
-- 3. Verify both policies are created
-- 4. Show employee count and leave request count
```

### Step 2: Refresh Browser
- Press Ctrl + Shift + R
- You'll now see a **"Leaves"** button in the header

### Step 3: Test the Feature
1. Click **"Leaves"** in the header
2. You should see:
   - Stats cards showing total, pending, approved, rejected counts
   - Filter buttons to switch between views
   - Full table of leave requests with employee details

## Expected Results

### After Running SQL Fix:
```
✅ Profiles Policies: 7 (including profiles_recruiter_view_all)
✅ Leave Request Policies: 6 (including leave_requests_recruiter_view)
✅ Employees Visible: 3
✅ Leave Requests Visible: [number of leave requests in DB]
👥 Employee List: Shivika, shal, dkdk
📋 Leave Requests: [list of recent leave requests]
```

### In the Leave Requests View:
```
┌─────────────────────────────────────────┐
│  Leave Requests                         │
│  Monitor and track employee leaves      │
│                                         │
│  [All: 5] [Pending: 2] [Approved: 3]  │
│                                         │
│  Stats:                                 │
│  - Total Requests: 5                    │
│  - Pending: 2 (awaiting approval)      │
│  - Approved: 3                          │
│  - Rejected: 0                          │
│                                         │
│  Table:                                 │
│  Employee | Type   | Start    | Days   │
│  Shivika  | Sick   | Nov 1    | 2 days │
│  shal     | Casual | Nov 5    | 1 day  │
│  ...                                    │
└─────────────────────────────────────────┘
```

## Access Levels

| Role | Leave Requests Access |
|------|----------------------|
| **Employee** | View/Create own only |
| **Recruiter** | **View all** ✅ (NEW!) |
| **Senior Manager** | View/Approve department |
| **Admin** | Full access |

## Files Created/Modified

1. ✅ `d:\hrms\src\components\recruiter\RecruiterLeaveView.tsx` - NEW component
2. ✅ `d:\hrms\src\components\dashboards\RecruiterDashboard.tsx` - Added route for 'leaves'
3. ✅ `d:\hrms\src\components\shared\Header.tsx` - Added "Leaves" button
4. ✅ `d:\hrms\supabase\URGENT_FIX_PROFILES_ACCESS.sql` - Updated to fix both profiles and leave_requests

## Navigation Structure

```
Recruiter Header:
┌──────────────────────────────────────────────────────────┐
│ Dashboard | Candidates | AI Screening | Voice Interview │
│ Attendance | Leaves ⭐NEW | Payroll | Reports | Settings│
└──────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Leave requests showing 0 or not loading?
1. Check console (F12) for errors
2. Verify RLS policy exists:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'leave_requests' 
   AND policyname = 'leave_requests_recruiter_view';
   ```
3. Test data access:
   ```sql
   SELECT COUNT(*) FROM leave_requests;
   ```

### Employee names showing "Unknown"?
1. Run `URGENT_FIX_PROFILES_ACCESS.sql` again
2. Verify profiles policy:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles' 
   AND policyname = 'profiles_recruiter_view_all';
   ```

## Next Steps

After enabling leave requests view:
1. ✅ Test the filter buttons (All, Pending, Approved, Rejected)
2. ✅ Have an employee apply for leave
3. ✅ Verify it shows up in recruiter's Leaves tab immediately
4. ✅ Check that employee details are displayed correctly
5. ✅ Verify real-time updates work (leave updates automatically)

## Future Enhancements (Optional)

Could add later:
- 📝 Approve/Reject buttons for recruiters (if they need this permission)
- 📊 Leave balance tracking per employee
- 📅 Calendar view of upcoming leaves
- 📈 Leave analytics and reports
- 🔔 Notifications for new leave requests

**Run `URGENT_FIX_PROFILES_ACCESS.sql` now to enable both attendance AND leave views!** 🚀
