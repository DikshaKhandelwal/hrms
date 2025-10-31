-- ============================================
-- TEST QUERY - Run this to verify RLS is working
-- ============================================
-- Run these queries in Supabase SQL Editor to check if data is accessible

-- Test 1: Check your profile
SELECT 
  '🧑 Your Profile' as test,
  id, 
  email, 
  full_name, 
  role 
FROM profiles 
WHERE id = auth.uid();

-- Test 2: Check if you can see attendance records
SELECT 
  '📅 Attendance Records' as test,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_count,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
FROM attendance;

-- Test 3: Check attendance for today
SELECT 
  '📊 Today Attendance' as test,
  a.id,
  a.date,
  a.status,
  a.check_in_time,
  p.full_name,
  p.email,
  p.role
FROM attendance a
JOIN profiles p ON a.employee_id = p.id
WHERE a.date = CURRENT_DATE
ORDER BY a.check_in_time DESC;

-- Test 4: Check all profiles you can see
SELECT 
  '👥 All Profiles' as test,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'employee' THEN 1 END) as employees,
  COUNT(CASE WHEN role = 'recruiter' THEN 1 END) as recruiters,
  COUNT(CASE WHEN role = 'senior_manager' THEN 1 END) as managers,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM profiles;

-- Test 5: Check leave requests
SELECT 
  '📋 Leave Requests' as test,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM leave_requests;

-- Test 6: Check RLS policies on attendance table
SELECT 
  '🔐 Attendance Policies' as test,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'attendance';

-- Test 7: Check the helper function
SELECT 
  '🛠️ Helper Function' as test,
  public.get_my_role() as your_role;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Test 1: Should show your profile (recruiter)
-- Test 2: Should show ALL attendance records (not 0)
-- Test 3: Should show today's attendance with employee names
-- Test 4: Should show all profiles in the system
-- Test 5: Should show all leave requests
-- Test 6: Should list all attendance policies (including attendance_recruiter_view)
-- Test 7: Should return 'recruiter'
-- ============================================

-- If any test returns 0 or no data, the RLS policies are still blocking access
-- In that case, re-run FIX_ALL_TABLES_RLS.sql
