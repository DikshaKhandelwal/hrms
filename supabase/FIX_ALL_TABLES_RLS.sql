-- ============================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- ============================================
-- This fixes RLS policies on:
-- 1. profiles (already done)
-- 2. attendance
-- 3. leave_requests
-- 4. payroll
-- 5. performance_reviews
-- 6. departments

-- ============================================
-- PART 1: Fix Attendance Table
-- ============================================

-- Drop all existing attendance policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'attendance') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON attendance', r.policyname);
    END LOOP;
END $$;

-- Create simple attendance policies
CREATE POLICY "attendance_select_own"
  ON attendance FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "attendance_insert_own"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "attendance_update_own"
  ON attendance FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Admin can see/manage all attendance (using helper function)
CREATE POLICY "attendance_admin_all"
  ON attendance FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Recruiters can view all attendance (for dashboard stats)
CREATE POLICY "attendance_recruiter_view"
  ON attendance FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

-- Senior managers can view department attendance
CREATE POLICY "attendance_manager_view"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- PART 2: Fix Leave Requests Table
-- ============================================

-- Drop all existing leave_requests policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leave_requests') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON leave_requests', r.policyname);
    END LOOP;
END $$;

-- Employees can manage their own leave requests
CREATE POLICY "leave_requests_own"
  ON leave_requests FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Admin can manage all leave requests
CREATE POLICY "leave_requests_admin_all"
  ON leave_requests FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Recruiters can view all leave requests
CREATE POLICY "leave_requests_recruiter_view"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

-- Senior managers can view and update department leave requests
CREATE POLICY "leave_requests_manager_view_update"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "leave_requests_manager_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- PART 3: Fix Payroll Table
-- ============================================

-- Drop all existing payroll policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payroll') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON payroll', r.policyname);
    END LOOP;
END $$;

-- Employees can view their own payroll
CREATE POLICY "payroll_select_own"
  ON payroll FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Admin can manage all payroll
CREATE POLICY "payroll_admin_all"
  ON payroll FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Recruiters can view all payroll (for stats)
CREATE POLICY "payroll_recruiter_view"
  ON payroll FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

-- Senior managers can view department payroll
CREATE POLICY "payroll_manager_view"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- PART 4: Fix Performance Reviews Table
-- ============================================

-- Drop all existing performance_reviews policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'performance_reviews') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON performance_reviews', r.policyname);
    END LOOP;
END $$;

-- Employees can view their own reviews
CREATE POLICY "performance_reviews_select_own"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Admin can manage all reviews
CREATE POLICY "performance_reviews_admin_all"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Recruiters can view all reviews
CREATE POLICY "performance_reviews_recruiter_view"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'recruiter');

-- Senior managers can manage department reviews
CREATE POLICY "performance_reviews_manager_all"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.get_my_role() = 'senior_manager'
    AND employee_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- PART 5: Fix Departments Table (if needed)
-- ============================================

-- Check if departments table has RLS enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'departments' AND relrowsecurity = true
    ) THEN
        -- Drop all existing department policies
        EXECUTE (
            SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON departments;', ' ')
            FROM pg_policies 
            WHERE tablename = 'departments'
        );
        
        -- Everyone can view departments
        CREATE POLICY "departments_view_all"
          ON departments FOR SELECT
          TO authenticated
          USING (true);
          
        -- Admin can manage departments
        CREATE POLICY "departments_admin_all"
          ON departments FOR ALL
          TO authenticated
          USING (public.get_my_role() = 'admin')
          WITH CHECK (public.get_my_role() = 'admin');
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all policies
SELECT 
  'attendance' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'attendance'
UNION ALL
SELECT 
  'leave_requests' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'leave_requests'
UNION ALL
SELECT 
  'payroll' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'payroll'
UNION ALL
SELECT 
  'performance_reviews' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'performance_reviews'
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test data access for current user
SELECT '✅ Your Profile' as test, COUNT(*) as count FROM profiles WHERE id = auth.uid()
UNION ALL
SELECT '✅ Attendance Data' as test, COUNT(*) as count FROM attendance
UNION ALL
SELECT '✅ Leave Requests' as test, COUNT(*) as count FROM leave_requests
UNION ALL
SELECT '✅ Payroll Data' as test, COUNT(*) as count FROM payroll
UNION ALL
SELECT '✅ Performance Reviews' as test, COUNT(*) as count FROM performance_reviews;

-- ============================================
-- AFTER RUNNING THIS
-- ============================================
-- 1. Refresh your browser (Ctrl + Shift + R)
-- 2. Check the Recruiter Dashboard
-- 3. Today's attendance should now be visible
-- 4. Leave requests should be visible
-- ============================================
