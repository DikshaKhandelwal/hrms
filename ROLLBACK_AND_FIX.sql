-- ============================================
-- ROLLBACK: Restore Original Policies First
-- ============================================
-- This will undo the changes and restore access

-- Step 1: Drop the new policies we just created
DROP POLICY IF EXISTS "Admins and managers can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can update all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can view department leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can approve department leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins and managers can view employee profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and managers can view all payroll" ON payroll;
DROP POLICY IF EXISTS "Admins and managers can view all performance reviews" ON performance_reviews;

-- Step 2: Recreate the ORIGINAL policies that were dropped

-- Original Attendance Policies
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

-- Original Leave Request Policy
CREATE POLICY "Managers can view and approve department leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('admin', 'senior_manager')
      AND p2.id = leave_requests.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department_id = p2.department_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('admin', 'senior_manager')
      AND p2.id = leave_requests.employee_id
    )
  );

-- Original Profile Policy
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

-- ============================================
-- NOW Apply the CORRECT Fix (Additive Only)
-- ============================================

-- Add admin attendance viewing WITHOUT removing employee policies
CREATE POLICY "Admins can view all attendance records"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Add admin leave request management WITHOUT breaking employee access
CREATE POLICY "Admins can manage any leave request"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any leave request"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Add admin profile viewing WITHOUT breaking self-view
CREATE POLICY "Admins can view all employee profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Add admin payroll and performance viewing
CREATE POLICY "Admins can view all payroll records"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all performance reviews records"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test your profile access
-- SELECT id, email, role, full_name FROM profiles WHERE id = auth.uid();

-- Test admin can see all profiles
-- SELECT COUNT(*) as total_profiles FROM profiles;

-- Test admin can see all attendance
-- SELECT COUNT(*) as total_attendance FROM attendance;

-- Test admin can see all leave requests
-- SELECT COUNT(*) as total_leaves FROM leave_requests;
