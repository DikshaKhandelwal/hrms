-- Fix RLS Policies for Cross-Dashboard Visibility
-- Allow admins to view all attendance and leave requests properly

-- Drop existing restrictive policies on attendance
DROP POLICY IF EXISTS "Managers can view their department attendance" ON attendance;

-- Create better policies that allow admins and managers to view attendance
CREATE POLICY "Admins and managers can view department attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('senior_manager', 'manager')
      AND p2.id = attendance.employee_id
    )
  );

-- Drop existing leave request policies
DROP POLICY IF EXISTS "Managers can view and approve department leave requests" ON leave_requests;

-- Recreate with better admin access
CREATE POLICY "Admins can view and manage all leave requests"
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

CREATE POLICY "Managers can view and approve department leave requests"
  ON leave_requests FOR SELECT, UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('senior_manager', 'manager')
      AND p2.id = leave_requests.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('senior_manager', 'manager')
      AND p2.id = leave_requests.employee_id
    )
  );

-- Add policy for admins to view all profiles (for employee list)
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;

CREATE POLICY "Admins and managers can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all
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
      AND p.role IN ('senior_manager', 'manager')
      AND p.department_id = profiles.department_id
    )
  );

-- Add policy for admins to update attendance (for corrections)
CREATE POLICY "Admins can update attendance"
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

-- Add policy for admins to view all payroll
CREATE POLICY "Admins can view department payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'senior_manager')
    )
  );

-- Add policy for admins to view all performance reviews
CREATE POLICY "Admins can view all reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'senior_manager')
    )
  );
