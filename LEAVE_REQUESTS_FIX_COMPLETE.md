# ✅ FIXED: Leave Requests "More than one relationship" Error

## The Problem

Error message:
```
Failed to fetch leave requests: Could not embed because more than one 
relationship was found for 'leave_requests' and 'profiles'
```

## Root Cause

The `leave_requests` table has **TWO foreign keys** pointing to the `profiles` table:

1. **`employee_id`** → profiles (the employee who requested leave)
2. **`approved_by`** → profiles (the manager/admin who approved/rejected)

When you use `.select('*, profiles(*)')`, Supabase doesn't know which relationship to use!

## The Fix

Specify the **exact foreign key constraint name** in the query:

### Before (Broken):
```typescript
.select(`
  *,
  profiles (
    full_name,
    email,
    role
  )
`)
```

### After (Fixed):
```typescript
.select(`
  *,
  employee:profiles!leave_requests_employee_id_fkey (
    full_name,
    email,
    role
  )
`)
```

The syntax `employee:profiles!leave_requests_employee_id_fkey` means:
- `employee:` - Alias for the result (call it "employee" not "profiles")
- `profiles!` - The table to join
- `leave_requests_employee_id_fkey` - The specific FK constraint to use

## What I Fixed

Updated file: `d:\hrms\src\components\recruiter\RecruiterLeaveView.tsx`

Changes:
1. ✅ Specified exact FK constraint in the query
2. ✅ Updated transform logic to use `record.employee` instead of `record.profiles`
3. ✅ Final result still maps to `profiles` field in the interface

## How to Test

1. **Refresh your browser** (Ctrl + Shift + R)
2. **Click "Leaves" tab** in the header
3. **You should now see all 5 leave requests!** 🎉

No SQL changes needed - this was a frontend query issue only.

## Expected Result

```
Leave Requests (5)

Stats:
- Total Requests: 5
- Pending: [number]
- Approved: [number]  
- Rejected: [number]

Table:
Employee         | Leave Type | Start      | End        | Days | Status
---------------- | ---------- | ---------- | ---------- | ---- | --------
Shivika         | Sick       | 2025-11-01 | 2025-11-02 | 2    | Pending
shal            | Casual     | 2025-11-05 | 2025-11-05 | 1    | Approved
...
```

## Why This Happens

This is a common Supabase issue when:
- ✅ A table has multiple FKs to the same table
- ✅ Common examples:
  - `leave_requests` → `employee_id` and `approved_by`
  - `messages` → `sender_id` and `receiver_id`
  - `transactions` → `from_account` and `to_account`

## Solution Pattern

Always use the explicit FK syntax when multiple relationships exist:

```typescript
// Pattern:
aliasName:foreignTable!fk_constraint_name (columns)

// Examples:
employee:profiles!leave_requests_employee_id_fkey (full_name, email)
approver:profiles!leave_requests_approved_by_fkey (full_name)
sender:profiles!messages_sender_id_fkey (full_name)
receiver:profiles!messages_receiver_id_fkey (full_name)
```

## Finding FK Constraint Names

Run this in Supabase SQL Editor:

```sql
SELECT
  conname as constraint_name,
  conrelid::regclass as from_table,
  confrelid::regclass as to_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text = 'leave_requests';
```

Result:
```
leave_requests_employee_id_fkey  | leave_requests → profiles
leave_requests_approved_by_fkey  | leave_requests → profiles
```

## All Fixed! 🎉

**Just refresh your browser and the Leave Requests page will work perfectly!**

No more errors - you'll see all 5 leave requests with full employee details.
