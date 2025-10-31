# 🔧 Troubleshooting "Error Loading Leave Requests"

## Possible Causes

1. **RLS Policies Not Applied Yet** - Most likely cause
2. **No Data in Database** - Leave requests table might be empty
3. **Helper Function Missing** - `get_my_role()` function doesn't exist
4. **Policy Syntax Error** - Policies created but with wrong conditions

## Solution Steps

### Step 1: Run the Debug Script
```sql
-- Copy and run: d:\hrms\supabase\DEBUG_AND_FIX_ALL.sql
```

This comprehensive script will:
- ✅ Check if helper function exists
- ✅ Check RLS status on all tables
- ✅ Show all current policies
- ✅ Create missing recruiter policies
- ✅ Test your access to each table
- ✅ Show actual data counts
- ✅ Display sample leave requests (if any)

### Step 2: Interpret Results

#### If you see "Leave count: 0"
This means **no employees have applied for leave yet**. This is normal!
- The error message will go away once you have data
- The UI should show "No leave requests found" instead of an error

#### If you see "permission denied" or "policy violation"
This means RLS policies are still blocking access.
- Run the full `FIX_ALL_TABLES_RLS.sql` script
- Or follow Step 3 below

### Step 3: Alternative - Quick Fix
If the debug script shows policies are missing, run this:

```sql
-- Quick fix for recruiter access
CREATE POLICY IF NOT EXISTS "profiles_recruiter_view_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

CREATE POLICY IF NOT EXISTS "attendance_recruiter_view"
  ON attendance FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

CREATE POLICY IF NOT EXISTS "leave_requests_recruiter_view"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');
```

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Share the exact error with me

Common errors you might see:
- `"new row violates row-level security policy"` → RLS blocking
- `"function public.get_my_role() does not exist"` → Run ABSOLUTE_EMERGENCY_FIX.sql first
- `"permission denied for table leave_requests"` → RLS policies not applied
- `"count: 0"` → No data yet (not an error!)

### Step 5: Verify Data Exists
Check if there are any leave requests in the database:

```sql
-- As admin in SQL Editor (bypasses RLS):
SELECT COUNT(*) FROM leave_requests;
```

If this returns 0, then the "error" is actually just "no data yet".

## Updated Component Behavior

I've updated `RecruiterLeaveView.tsx` to:
- ✅ Show detailed error logs in console
- ✅ Handle empty data gracefully (not as an error)
- ✅ Display "No leave requests found" when table is empty
- ✅ Only show error message for actual errors

## Testing After Fix

1. **Create test leave request** as an employee:
   - Log in as employee (e.g., Shivika)
   - Go to Leaves page
   - Apply for leave
   
2. **Check recruiter view**:
   - Log in as recruiter
   - Go to Leaves tab
   - Should now see the leave request!

## Quick Diagnosis Checklist

Run these in order:

```sql
-- 1. Check helper function
SELECT public.get_my_role();
-- Should return: 'recruiter'

-- 2. Check policies exist
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'leave_requests' 
AND policyname LIKE '%recruiter%';
-- Should return: 1 or more

-- 3. Check data exists
SELECT COUNT(*) FROM leave_requests;
-- Any number is fine (0 = no data yet, not an error)

-- 4. Test access
SELECT * FROM leave_requests LIMIT 1;
-- Should return 1 row or "no rows" (not "permission denied")
```

## Most Likely Issue

Based on your error, I suspect:
1. ❌ The RLS policies haven't been applied yet
2. ❌ You haven't run `URGENT_FIX_PROFILES_ACCESS.sql` or `DEBUG_AND_FIX_ALL.sql`

**Run `DEBUG_AND_FIX_ALL.sql` now - it will diagnose AND fix the issue!** 🔧

## Expected Output After Fix

```
Helper Function: EXISTS ✅
RLS Status: ENABLED ✅
Policies created: ✅ profiles_recruiter_view_all, attendance_recruiter_view, leave_requests_recruiter_view
Your Profile: Diksha Khandelwal (recruiter) ✅
Employees: 3 ✅
Attendance: [some number] ✅
Leave Requests: [0 or more] ✅
```

If leave requests is 0, the UI will show "No leave requests found" (not an error).
