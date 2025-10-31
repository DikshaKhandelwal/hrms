# 🚨 URGENT: Total Employees Shows 0

## Problem
- ✅ 3 employees exist in database (Shivika, shal, dkdk)
- ✅ 2 attendance records exist for today
- ❌ Total Employees shows **0**
- ❌ Employee names show "Unknown"

## Root Cause
**RLS policies on the `profiles` table are blocking recruiters from viewing employee profiles.**

Even though you can see attendance records, the JOIN to get employee names is failing because the recruiter role doesn't have permission to SELECT from the profiles table.

## Immediate Fix

### Step 1: Run This SQL Script
Copy and paste `URGENT_FIX_PROFILES_ACCESS.sql` into Supabase SQL Editor and run it.

This will:
1. Add a policy allowing recruiters to view all profiles
2. Verify the policy was created
3. Test if you can see employees
4. Show the actual employee list

### Step 2: Check Results
After running the script, you should see:
```
✅ Profiles Policies: Should list multiple policies including "profiles_recruiter_view_all"
✅ Employees Visible: Should show 3
👥 Employee List: Should show Shivika, shal, dkdk with their full details
🧑 Your Profile: Should show your profile (Diksha Khandelwal)
```

### Step 3: Refresh Browser
1. Refresh your browser (Ctrl + Shift + R)
2. Click on Attendance tab
3. Total Employees should now show **3**
4. Employee names should show instead of "Unknown"

## Verification Checklist

Run these queries in Supabase SQL Editor to debug:

### 1. Check if helper function exists:
```sql
SELECT public.get_my_role();
-- Should return: 'recruiter'
```

### 2. Check profiles policies:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
-- Should include policies for recruiters
```

### 3. Test employee count:
```sql
SELECT COUNT(*) 
FROM profiles 
WHERE role = 'employee';
-- Should return: 3
```

### 4. Test profile join:
```sql
SELECT 
  a.id,
  a.date,
  a.status,
  p.full_name,
  p.email,
  p.role
FROM attendance a
LEFT JOIN profiles p ON a.employee_id = p.id
WHERE a.date = CURRENT_DATE;
-- Should show employee names (not NULL)
```

## If Still Not Working

### Option 1: Run the Full RLS Fix
```sql
-- Run: FIX_ALL_TABLES_RLS.sql
-- This fixes ALL tables at once
```

### Option 2: Check for Errors in Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - "policy violation" 
   - "permission denied"
   - "new row violates row-level security"

### Option 3: Verify Policy Structure
The recruiter needs these policies on `profiles`:
- ✅ `profiles_select_own` - View own profile
- ✅ `profiles_recruiter_view_all` - View all profiles (NEW)

## Expected After Fix

### Before:
```
Total Employees: 0
Present Today: 2
Attendance Records (2):
- Unknown (role: —) - PRESENT
- Unknown (role: —) - PRESENT
```

### After:
```
Total Employees: 3
Present Today: 2
Attendance Records (2):
- Shivika (role: employee) - PRESENT
- shal (role: employee) - PRESENT
```

## Why This Happened

The original `ABSOLUTE_EMERGENCY_FIX.sql` created the `get_my_role()` helper function and basic policies, but it focused on fixing your profile access (which worked - you can log in!).

However, it didn't explicitly add a policy for **recruiters to view OTHER profiles**. The policies created were:
- ✅ Users can view **their own** profile (works)
- ✅ Admins can view **all** profiles (works for admins)
- ❌ Recruiters can view **all** profiles (MISSING!)

The `URGENT_FIX_PROFILES_ACCESS.sql` adds that missing policy.

## Next Steps After Fix

Once employee count shows correctly:
1. ✅ Verify attendance records show employee names
2. ✅ Verify "Present Today" count matches attendance records
3. ✅ Test marking attendance as an employee
4. ✅ Verify it appears in recruiter dashboard immediately
