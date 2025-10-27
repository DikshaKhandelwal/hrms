# Fix for "new row violates row-level security policy" Error

## Problem
Sign-up fails with RLS policy violation because the client-side code tries to directly insert into the `profiles` table, but RLS policies may block this.

## Solution: Use Database Trigger (Recommended)

This approach uses a PostgreSQL trigger that runs with elevated privileges to automatically create the profile when a user signs up.

### Step 1: Apply the Database Trigger

Open your Supabase SQL Editor and run this script:

**File: `alternative_profile_trigger.sql`**

```sql
-- Create a function that runs with elevated privileges to insert profiles
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
```

### Step 2: Code Changes Already Applied

The `AuthContext.tsx` has been updated to:
- Pass user metadata (full_name, role) during sign-up
- Let the database trigger handle profile creation
- Wait briefly for the trigger to complete before fetching the profile

### Step 3: Test the Fix

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Try signing up again** with:
   - Full Name: dk
   - Email: diksha1010.dk@gmail.com
   - Password: (your password)
   - Role: Recruiter

3. **Expected result:**
   - ✅ No RLS policy error
   - ✅ User is created
   - ✅ Profile is automatically created by trigger
   - ✅ User is logged in and sees dashboard

## Alternative Solution: Fix RLS Policies Directly

If you prefer to keep client-side profile creation (not recommended), run this:

**File: `debug_and_fix_profiles_rls.sql`**

This script will:
1. Drop all existing policies on `profiles`
2. Recreate them with proper permissions
3. Verify the policies are correct

## How It Works

### Trigger-Based Approach (Recommended)
1. User signs up via Supabase Auth
2. `auth.users` table gets a new row
3. Trigger `on_auth_user_created` fires automatically
4. Function `handle_new_user()` runs with elevated privileges (SECURITY DEFINER)
5. Profile is created in `profiles` table (bypasses RLS)
6. Client fetches the profile

### Benefits
- ✅ Bypasses RLS complexity
- ✅ Atomic operation
- ✅ Works even with strict RLS policies
- ✅ No client-side RLS errors
- ✅ Consistent profile creation

## Troubleshooting

### If you still see the error:

1. **Verify the trigger was created:**
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Check for existing profiles:**
   ```sql
   SELECT id, email, full_name, role FROM profiles;
   ```

3. **Delete test user if needed:**
   ```sql
   -- In Supabase Dashboard > Authentication > Users
   -- Delete the user: diksha1010.dk@gmail.com
   -- Then try signing up again
   ```

4. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
   ```

## Testing Checklist

- [ ] Applied the trigger SQL in Supabase
- [ ] Restarted dev server
- [ ] Cleared browser cache/storage
- [ ] Deleted any failed test users
- [ ] Tried sign-up again
- [ ] Sign-up succeeds without errors
- [ ] Dashboard loads correctly
- [ ] User role is set correctly

## Next Steps After Fix

Once sign-up works:
1. Test all role types (employee, recruiter, manager, admin)
2. Verify role-based dashboard access
3. Test login with existing users
4. Implement AI features (resume screening, voice interviews)
