-- ============================================
-- DEBUG: Check User and Profile Status
-- ============================================

-- Step 1: Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Check auth.users (replace with your email)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'diksha1010.dk@gmail.com';

-- Step 3: Check if profile exists (replace with the user ID from step 2)
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'diksha1010.dk@gmail.com';

-- ============================================
-- MANUAL FIX: Create Profile if Missing
-- ============================================
-- If profile doesn't exist, uncomment and run this:
-- Replace 'USER_ID_HERE' with the actual user ID from Step 2

/*
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
*/

-- ============================================
-- Alternative: Create profiles for ALL users missing them
-- ============================================
/*
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  COALESCE((raw_user_meta_data->>'role')::user_role, 'employee')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- Verify the fix worked
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.full_name,
  p.role,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
