-- ============================================
-- EMERGENCY FIX - Run This IMMEDIATELY
-- ============================================
-- This restores basic access so you can log in

-- First, let's see what policies exist on profiles
-- Run this first to check:
-- SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Drop ALL broken policies on profiles table
DROP POLICY IF EXISTS "Admins and managers can view employee profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all employee profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;

-- Recreate the ESSENTIAL policies that MUST exist
-- These are from your original migration

-- 1. CRITICAL: Users MUST be able to see their OWN profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Admins can manage ALL profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 5. Managers can view their department
CREATE POLICY "Managers can view their department profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'senior_manager'
      AND p.department_id = profiles.department_id
    )
  );

-- Now fix attendance access
DROP POLICY IF EXISTS "Admins and managers can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance records" ON attendance;
DROP POLICY IF EXISTS "Admins can update all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can update any attendance" ON attendance;

-- Recreate attendance policies
CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Managers can view their department attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role = 'senior_manager'
      AND p2.id = attendance.employee_id
    )
  );

-- Now fix leave requests access
DROP POLICY IF EXISTS "Admins can manage all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can manage any leave request" ON leave_requests;
DROP POLICY IF EXISTS "Admins can update any leave request" ON leave_requests;
DROP POLICY IF EXISTS "Managers can view department leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can approve department leave requests" ON leave_requests;

-- Recreate leave request policies
CREATE POLICY "Admins can manage all leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Managers can view and approve department leave requests"
  ON leave_requests FOR ALL
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

-- Fix payroll and performance access
DROP POLICY IF EXISTS "Admins and managers can view all payroll" ON payroll;
DROP POLICY IF EXISTS "Admins can view all payroll records" ON payroll;
DROP POLICY IF EXISTS "Admins and managers can view all performance reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Admins can view all performance reviews records" ON performance_reviews;

-- Add admin payroll viewing (in addition to existing employee policy)
CREATE POLICY "Admins can view all payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add admin performance review viewing
CREATE POLICY "Admins can view all performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- TEST QUERIES - Run these after
-- ============================================

-- Test 1: Can you see your own profile?
-- SELECT id, email, role, full_name FROM profiles WHERE id = auth.uid();

-- Test 2: List all policies on profiles
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Test 3: Can admin see all profiles?
-- SELECT COUNT(*) FROM profiles;

-- Test 4: Can admin see all attendance?
-- SELECT COUNT(*) FROM attendance;

-- Test 5: Can admin see all leave requests?
-- SELECT COUNT(*) FROM leave_requests;
