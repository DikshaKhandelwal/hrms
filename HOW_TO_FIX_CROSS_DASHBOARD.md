# FIX: Cross-Dashboard Data Not Visible

## Problem
- Employee marks attendance → HR/Admin dashboard doesn't show it
- Employee applies for leave → Manager/Admin can't see it
- Attendance and leave data not visible across dashboards

## Root Cause
The database Row Level Security (RLS) policies are too restrictive. They only allow:
- Employees to see their OWN data
- Managers to see DEPARTMENT data (but policies were incomplete)
- Admins couldn't see ALL data properly

## Solution: Apply SQL Fix

### Option 1: Via Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the contents of `APPLY_THIS_FIX.sql` file
6. Paste into the SQL editor
7. Click **"Run"** button
8. You should see "Success. No rows returned" (this is good!)

### Option 2: Via Migration File
If you're using Supabase CLI:
```bash
cd /d/hrms
npx supabase db push
```

## What This Fix Does

### 1. Attendance Table
- ✅ Admins can now VIEW all attendance records
- ✅ Admins can UPDATE attendance (for corrections)
- ✅ Managers can VIEW their department's attendance
- ✅ Employees can still view/create their own attendance

### 2. Leave Requests Table
- ✅ Admins can VIEW and MANAGE all leave requests
- ✅ Managers can VIEW and APPROVE their department's leaves
- ✅ Employees can still create/view their own leaves

### 3. Profiles Table
- ✅ Admins can VIEW all employee profiles
- ✅ Managers can VIEW their department's profiles
- ✅ Employees can still view their own profile

### 4. Payroll & Performance Reviews
- ✅ Admins can VIEW all payroll and performance data
- ✅ Managers can VIEW their department's data
- ✅ Employees can still view their own data

## After Applying the Fix

1. **Refresh your browser** - Clear cache (Ctrl+Shift+R)
2. **Log in as Admin** - Navigate to "Employees" view
3. **Verify**: You should now see:
   - All employees listed
   - Their attendance records
   - Pending leave requests
   - Full statistics

## Testing Checklist

Run these queries in Supabase SQL Editor to verify:

```sql
-- Test 1: Check total attendance records (should return a number)
SELECT COUNT(*) as total_attendance_records FROM attendance;

-- Test 2: Check total leave requests (should return a number)
SELECT COUNT(*) as total_leave_requests FROM leave_requests;

-- Test 3: Check total employees (should return a number)
SELECT COUNT(*) as total_employees FROM profiles;

-- Test 4: Check your role (should show 'admin')
SELECT role, full_name FROM profiles WHERE id = auth.uid();
```

## Still Having Issues?

If data still doesn't show up:

1. **Check Your User Role**
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```
   Make sure your role is `'admin'` (not `'Admin'` - case matters!)

2. **Check if Data Exists**
   ```sql
   SELECT * FROM attendance LIMIT 5;
   SELECT * FROM leave_requests LIMIT 5;
   ```

3. **Verify Policies Applied**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('attendance', 'leave_requests', 'profiles');
   ```

## Frontend Should Work After Fix

Once the SQL fix is applied, your dashboards will automatically work because:
- `dashboardService.ts` queries will now return data (RLS will allow it)
- Admin Dashboard's "Employee Overview" will populate
- Leave Approval Dashboard will show pending requests
- Manager Dashboard will show team data

No frontend code changes needed! 🎉
