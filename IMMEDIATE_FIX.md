# 🔧 IMMEDIATE FIX - Profile Not Found Error

## Your Situation
- ✅ User account created: `diksha1010.dk@gmail.com`
- ✅ User ID: `23a7e4c7-2205-46be-b2f7-68314e93e1ab`
- ❌ Profile NOT created in database
- ❌ Database trigger didn't fire or doesn't exist

## 🚀 Quick Fix (Do This Now)

### Step 1: Create Your Profile Manually

Open Supabase Dashboard → SQL Editor → Run this:

```sql
-- Create the missing profile for your user
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
```

### Step 2: Verify It Worked

Run this to check:

```sql
SELECT id, email, full_name, role 
FROM profiles 
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';
```

You should see:
- ✅ email: diksha1010.dk@gmail.com
- ✅ full_name: dk
- ✅ role: recruiter

### Step 3: Refresh Your App

In your browser:
1. Press F12 to open DevTools → Console tab
2. Click the "Retry" button OR refresh the page (F5)
3. You should now see the Recruiter Dashboard! 🎉

---

## 🔒 Permanent Fix for Future Sign-ups

The trigger didn't fire for your sign-up. Let's ensure it works for next users:

### Run This in Supabase SQL Editor:

```sql
-- Create the trigger function
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

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Verify the trigger exists:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return: `on_auth_user_created | users`

---

## 📋 What to Check in Browser Console

Open browser DevTools (F12) → Console tab. Look for:

✅ **Good signs:**
```
Fetching profile for user: 23a7e4c7-2205-46be-b2f7-68314e93e1ab
Profile loaded successfully: {id: "...", role: "recruiter", ...}
Rendering dashboard for role: recruiter
```

❌ **Bad signs:**
```
Profile fetch error: {...}
No profile found for user: ...
```

---

## ✅ After the Fix - Test Checklist

- [ ] Ran Step 1 SQL (create profile manually)
- [ ] Verified profile exists in database
- [ ] Refreshed browser / clicked Retry
- [ ] Saw Recruiter Dashboard load
- [ ] Sidebar shows: Dashboard, Candidates, AI Screening, Voice Interview, Analytics
- [ ] Header shows your name (dk) and email
- [ ] No errors in browser console
- [ ] Applied trigger fix (Step 2) for future users

---

## 🎯 Expected Result

After Step 1, you should see:

### Recruiter Dashboard with:
- 📊 Statistics cards (candidates, interviews, etc.)
- 📝 Left sidebar with recruiter-specific menu
- 👤 Top-right header with your profile (dk / diksha1010.dk@gmail.com)
- 🚪 Sign Out button works

---

## 🆘 Still Not Working?

Check browser console and share any error messages. Common issues:

1. **RLS Policy Error**: Profile created but can't be read
   - Solution: Check RLS policies on profiles table
   
2. **Auth Session Invalid**: User session expired
   - Solution: Sign out and sign in again

3. **Supabase Connection Error**: Network/API key issue
   - Solution: Check .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

---

## 📁 Files I Created

1. **`FIX_DIKSHA_PROFILE.sql`** - Complete fix for your specific user
2. **`DEBUG_AND_FIX_PROFILE.sql`** - General debugging script
3. **Updated `App.tsx`** - Now shows helpful error message with user ID
4. **Updated `AuthContext.tsx`** - Better logging and debugging

---

## Quick Copy-Paste Command

**Just run this in Supabase SQL Editor:**

```sql
INSERT INTO profiles (id, email, full_name, role) VALUES ('23a7e4c7-2205-46be-b2f7-68314e93e1ab', 'diksha1010.dk@gmail.com', 'dk', 'recruiter') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
```

Then refresh your app! 🚀
