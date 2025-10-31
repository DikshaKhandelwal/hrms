-- ============================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- ============================================
-- This fixes RLS policies so admins can see all employee data
-- including attendance and leave requests across dashboards

-- Step 1: Fix Attendance Policies
-- ================================

-- Drop the restrictive manager policy
DROP POLICY IF EXISTS "Managers can view their department attendance" ON attendance;

-- Add comprehensive view policy for admins and managers
CREATE POLICY "Admins and managers can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    -- Admins can see everything
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
    OR
    -- Managers see their department
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = attendance.employee_id
    )
  );

-- Allow admins to update attendance
CREATE POLICY "Admins can update all attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );


-- Step 2: Fix Leave Request Policies
-- ===================================

-- Drop the combined policy
DROP POLICY IF EXISTS "Managers can view and approve department leave requests" ON leave_requests;

-- Add separate admin policy
CREATE POLICY "Admins can manage all leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Add manager policy
CREATE POLICY "Managers can view department leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = leave_requests.employee_id
    )
  );

CREATE POLICY "Managers can approve department leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = leave_requests.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = leave_requests.employee_id
    )
  );


-- Step 3: Fix Profile Viewing
-- ============================

-- Drop restrictive manager profile policy
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;

-- Add comprehensive profile viewing
CREATE POLICY "Admins and managers can view employee profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all profiles
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
    OR
    -- Managers can see their department
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'senior_manager'
      AND p.department_id = profiles.department_id
    )
  );


-- Step 4: Allow Admins to View Payroll and Performance Reviews
-- =============================================================

CREATE POLICY "Admins and managers can view all payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'senior_manager')
    )
  );

CREATE POLICY "Admins and managers can view all performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'senior_manager')
    )
  );


-- ============================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================

-- Test 1: Check if admin can see all attendance
-- SELECT COUNT(*) as total_attendance_records FROM attendance;

-- Test 2: Check if admin can see all leave requests
-- SELECT COUNT(*) as total_leave_requests FROM leave_requests;

-- Test 3: Check if admin can see all profiles
-- SELECT COUNT(*) as total_employees FROM profiles;

-- Test 4: View your own role
-- SELECT role, full_name FROM profiles WHERE id = auth.uid();
