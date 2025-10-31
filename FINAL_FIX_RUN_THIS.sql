-- ============================================
-- SUPER EMERGENCY FIX - Run This NOW
-- ============================================
-- This will fix your profile access immediately

-- Step 1: Drop EVERYTHING on profiles and recreate from scratch
DO $$ 
BEGIN
    -- Drop all existing policies on profiles
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON profiles;', ' ')
        FROM pg_policies 
        WHERE tablename = 'profiles'
    );
END $$;

-- Step 2: Recreate ONLY the essential policies

-- CRITICAL: Users MUST see their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can do everything
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

-- Managers can view their department
CREATE POLICY "Managers can view department profiles"
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

-- Step 3: Fix attendance (drop all first)
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON attendance;', ' ')
        FROM pg_policies 
        WHERE tablename = 'attendance'
    );
END $$;

CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can view their own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create their own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can view department attendance"
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

-- Step 4: Fix leave_requests (drop all first)
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON leave_requests;', ' ')
        FROM pg_policies 
        WHERE tablename = 'leave_requests'
    );
END $$;

CREATE POLICY "Employees can manage their own leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can manage all leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
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
  );

-- Step 5: Fix payroll (drop all first, keep only essential ones)
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON payroll;', ' ')
        FROM pg_policies 
        WHERE tablename = 'payroll'
        AND policyname NOT IN ('Admins can manage all payroll', 'Employees can view their own payroll')
    );
END $$;

-- Only add if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payroll' 
        AND policyname = 'Admins can view all payroll'
    ) THEN
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
    END IF;
END $$;

-- Step 6: Fix performance_reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'performance_reviews' 
        AND policyname = 'Admins can view all performance reviews'
    ) THEN
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
    END IF;
END $$;

-- ============================================
-- VERIFICATION - Run these after
-- ============================================

-- Your profile should appear now:
SELECT id, email, role, full_name FROM profiles WHERE id = auth.uid();
