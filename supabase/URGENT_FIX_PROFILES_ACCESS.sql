-- ============================================
-- URGENT: Fix Recruiter Access to Profiles and Leaves
-- ============================================
-- This allows recruiters to VIEW employee profiles AND leave requests
-- Run this NOW in Supabase SQL Editor

-- Step 1: Add policy for recruiters to view all profiles
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_recruiter_view_all'
    ) THEN
        CREATE POLICY "profiles_recruiter_view_all"
          ON profiles FOR SELECT
          TO authenticated
          USING (public.get_my_role() = 'recruiter');
        
        RAISE NOTICE 'Created policy: profiles_recruiter_view_all';
    ELSE
        RAISE NOTICE 'Policy profiles_recruiter_view_all already exists';
    END IF;
END $$;

-- Step 2: Add policy for recruiters to view all leave requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leave_requests' 
        AND policyname = 'leave_requests_recruiter_view'
    ) THEN
        CREATE POLICY "leave_requests_recruiter_view"
          ON leave_requests FOR SELECT
          TO authenticated
          USING (public.get_my_role() = 'recruiter');
        
        RAISE NOTICE 'Created policy: leave_requests_recruiter_view';
    ELSE
        RAISE NOTICE 'Policy leave_requests_recruiter_view already exists';
    END IF;
END $$;

-- Verify the policies were created
SELECT 
  '✅ Profiles Policies' as check_type,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'profiles'
UNION ALL
SELECT 
  '✅ Leave Request Policies' as check_type,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'leave_requests';

-- Test if you can see employees now
SELECT 
  '✅ Employees Visible' as check_type,
  COUNT(*) as employee_count
FROM profiles 
WHERE role = 'employee';

-- Test if you can see leave requests
SELECT 
  '✅ Leave Requests Visible' as check_type,
  COUNT(*) as leave_count
FROM leave_requests;

-- Show the actual employees
SELECT 
  '👥 Employee List' as info,
  id,
  full_name,
  email,
  role
FROM profiles 
WHERE role = 'employee';

-- Show leave requests with employee names
SELECT 
  '📋 Leave Requests' as info,
  lr.id,
  p.full_name as employee_name,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.status
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
ORDER BY lr.applied_date DESC
LIMIT 10;

-- Test if you can see your own profile
SELECT 
  '🧑 Your Profile' as info,
  id,
  full_name,
  email,
  role
FROM profiles 
WHERE id = auth.uid();
