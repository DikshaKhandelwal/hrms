# 🚀 QUICK FIX - Copy This Exact Script

## The Problem
- Permission denied for `auth` schema
- Infinite recursion in RLS policies
- Profile not found

## ✅ The Solution

Use **SIMPLE_FIX.sql** - it doesn't need any helper functions in the auth schema.

---

## 📋 Copy and Run This in Supabase SQL Editor

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;

-- Create simple policies (no recursion, no admin checks)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create your profile
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'dk',
  role = 'recruiter',
  email = 'diksha1010.dk@gmail.com';

-- Install trigger for future users
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
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## After Running

1. ✅ Check Supabase output - should show success
2. 🔄 Refresh your app (F5)
3. 🎉 **Dashboard should load!**

---

## Expected Result

You should see:
- ✅ Policies Created: 4 policies
- ✅ Trigger Created: on_auth_user_created
- ✅ Profile Created: Your profile data
- ✅ No more 500 errors
- ✅ Recruiter Dashboard loads

---

## Note on Admin Access

This simple fix means:
- ✅ Users can read/update their own profile
- ⚠️ Admins DON'T have special privileges (to avoid recursion)

If you need admin access later, we can add it using a different approach (service role key on backend, or database functions).

For now, this gets you into the app! 🚀

---

## Files to Use

1. **`SIMPLE_FIX.sql`** ⭐ - Use this one! No auth schema needed
2. ~~`COMPLETE_FIX.sql`~~ - Skip this (has auth schema issues)

Run `SIMPLE_FIX.sql` and you're done!
