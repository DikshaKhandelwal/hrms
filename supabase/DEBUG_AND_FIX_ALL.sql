-- ============================================
-- COMPREHENSIVE DEBUG AND FIX
-- ============================================
-- This will diagnose and fix all access issues

-- Step 0: Check if helper function exists
SELECT 
  '🔧 Helper Function' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_role') 
    THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- Test the helper function
DO $$
BEGIN
  BEGIN
    PERFORM public.get_my_role();
    RAISE NOTICE 'Helper function works! Your role: %', public.get_my_role();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Helper function error: %', SQLERRM;
  END;
END $$;

-- Step 1: Check current RLS status
SELECT 
  '🔒 RLS Status' as check_type,
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'attendance', 'leave_requests')
ORDER BY tablename;

-- Step 2: Check existing policies
SELECT 
  '📋 Current Policies' as info,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'attendance', 'leave_requests')
ORDER BY tablename, policyname;

-- Step 3: Add/Update recruiter policies
-- Profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_recruiter_view_all'
    ) THEN
        CREATE POLICY "profiles_recruiter_view_all"
          ON profiles FOR SELECT
          TO authenticated
          USING (public.get_my_role() = 'recruiter');
        RAISE NOTICE '✅ Created policy: profiles_recruiter_view_all';
    ELSE
        RAISE NOTICE '⚠️ Policy profiles_recruiter_view_all already exists';
    END IF;
END $$;

-- Attendance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attendance' 
        AND policyname = 'attendance_recruiter_view'
    ) THEN
        CREATE POLICY "attendance_recruiter_view"
          ON attendance FOR SELECT
          TO authenticated
          USING (public.get_my_role() = 'recruiter');
        RAISE NOTICE '✅ Created policy: attendance_recruiter_view';
    ELSE
        RAISE NOTICE '⚠️ Policy attendance_recruiter_view already exists';
    END IF;
END $$;

-- Leave Requests
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
        RAISE NOTICE '✅ Created policy: leave_requests_recruiter_view';
    ELSE
        RAISE NOTICE '⚠️ Policy leave_requests_recruiter_view already exists';
    END IF;
END $$;

-- Step 4: Verify policies were created
SELECT 
  '✅ Updated Policies' as check_type,
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE tablename IN ('profiles', 'attendance', 'leave_requests')
GROUP BY tablename
ORDER BY tablename;

-- Step 5: Test your access
SELECT '👤 Your Profile Test' as test;
SELECT id, email, full_name, role FROM profiles WHERE id = auth.uid();

SELECT '👥 Employees Test' as test;
SELECT COUNT(*) as employee_count FROM profiles WHERE role = 'employee';

SELECT '📅 Attendance Test' as test;
SELECT COUNT(*) as attendance_count FROM attendance;

SELECT '📋 Leave Requests Test' as test;
SELECT COUNT(*) as leave_count FROM leave_requests;

-- Step 6: Detailed leave requests query
SELECT 
  '📋 Actual Leave Requests' as info,
  lr.id,
  lr.employee_id,
  p.full_name as employee_name,
  p.email,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.status,
  lr.reason
FROM leave_requests lr
LEFT JOIN profiles p ON lr.employee_id = p.id
ORDER BY lr.applied_date DESC
LIMIT 5;

-- Step 7: Check if any data exists
SELECT 
  '📊 Data Counts' as summary,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE role = 'employee') as employees,
  (SELECT COUNT(*) FROM attendance) as attendance_records,
  (SELECT COUNT(*) FROM leave_requests) as leave_requests;

-- ============================================
-- RESULTS INTERPRETATION
-- ============================================
-- If you see:
-- ✅ Helper function EXISTS - Good!
-- ✅ RLS ENABLED on all tables - Good!
-- ✅ Policies created successfully - Good!
-- ✅ Employee count > 0 - Good!
-- ✅ Leave count >= 0 - Good (0 means no leaves yet)
--
-- If leave_requests count is 0, that means no one has applied for leave yet!
-- The error in the UI might just be "no data" not "access denied"
-- ============================================
