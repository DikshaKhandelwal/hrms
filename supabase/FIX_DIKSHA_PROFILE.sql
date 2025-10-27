-- ============================================
-- COPY THIS ENTIRE SCRIPT AND RUN IN SUPABASE
-- ============================================

-- Part 1: Fix your current profile
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email = EXCLUDED.email;

-- Part 2: Install trigger for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Verify everything is working
-- ============================================

-- Check trigger
SELECT 'Trigger status:' as check_type, 
       CASE WHEN COUNT(*) > 0 THEN '✅ Trigger exists' ELSE '❌ Trigger missing' END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
-- Check profile
SELECT 'Profile status:' as check_type,
       CASE WHEN COUNT(*) > 0 THEN '✅ Profile exists' ELSE '❌ Profile missing' END as status
FROM profiles
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';
