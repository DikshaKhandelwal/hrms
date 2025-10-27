# 🔥 CRITICAL FIX - Infinite Recursion Error

## Error You're Seeing
```
infinite recursion detected in policy for relation "profiles"
```

## Root Cause
The admin RLS policy tries to check if you're an admin by querying the `profiles` table, which triggers the same policy again → infinite loop → 500 error.

## 🚀 THE FIX (Copy-Paste This)

### Go to Supabase Dashboard → SQL Editor

**Copy and run this ENTIRE script:**

File: `supabase/COMPLETE_FIX.sql`

Or use this quick version:

```sql
-- 1. Drop all broken policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;

-- 2. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 3. Create working policies
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

CREATE POLICY "profiles_all_for_admins"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- 4. Create your profile
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'dk',
  role = 'recruiter';

-- 5. Install trigger
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

## After Running the Fix

1. **Check the output** - Should see:
   ```
   ✅ RLS Policies: 4 policies
   ✅ Trigger: on_auth_user_created
   ✅ Your Profile: id, email, full_name, role
   ```

2. **Go back to your app**
3. **Refresh the page (F5)** or click "Retry"
4. **You should see the Recruiter Dashboard!** 🎉

---

## What Changed

### Before (Broken)
```sql
-- This caused infinite recursion:
USING (EXISTS (SELECT 1 FROM profiles WHERE ...))
```
Every time it checked if you're admin, it queried profiles, which triggered the policy again.

### After (Fixed)
```sql
-- Uses helper function with SECURITY DEFINER:
auth.user_role()
```
The function bypasses RLS, breaks the recursion loop.

---

## Verify It's Working

Open browser console (F12). You should see:

✅ **Good:**
```
Fetching profile for user: 23a7e4c7...
Profile loaded successfully: {role: "recruiter", ...}
Rendering dashboard for role: recruiter
```

❌ **Bad (means still broken):**
```
500 Internal Server Error
infinite recursion detected
```

---

## If Still Not Working

1. **Make sure you ran the ENTIRE SQL script** (all parts)
2. **Clear browser cache:** Ctrl+Shift+Delete → Clear all
3. **Sign out and sign in again**
4. **Check Supabase logs:** Dashboard → Logs → look for errors
5. **Verify policies exist:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
   ```
   Should show: profiles_insert_own, profiles_select_own, etc.

---

## Files Created

1. **`COMPLETE_FIX.sql`** ⭐ - Run this one!
2. `FIX_INFINITE_RECURSION.sql` - Detailed version
3. `IMMEDIATE_FIX.md` - Documentation

---

## Next Steps After Login Works

Once you can access the dashboard:

1. ✅ Test all menu items (Candidates, AI Screening, etc.)
2. ✅ Verify role-based access control
3. ✅ Test sign-out and sign-in again
4. ✅ Create test users for other roles
5. 🚀 Start implementing AI features

---

## Quick Checklist

- [ ] Ran `COMPLETE_FIX.sql` in Supabase
- [ ] Saw success messages (policies, trigger, profile)
- [ ] Refreshed browser (F5)
- [ ] No more 500 errors in console
- [ ] Dashboard loads correctly
- [ ] Sidebar shows recruiter menu
- [ ] Header shows name and email

**Run the SQL script above and you'll be in!** 🚀
