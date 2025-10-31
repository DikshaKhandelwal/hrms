# 💰 Payroll Feature - Complete Setup Guide

## ✅ What's Been Implemented

### 1. **Payroll Data Generation SQL Script**
- **File**: `supabase/migrations/generate_payroll_data.sql`
- **What it does**: 
  - Generates 6 months of payroll data (June-November 2024)
  - Creates realistic salaries based on job titles
  - Calculates allowances, deductions, and taxes automatically
  - Sets payment status (processed for past months, pending for current)

### 2. **PayrollPage Component**
- **File**: `src/components/payroll/PayrollPage.tsx`
- **Features**:
  - ✅ Stats cards (Total Payroll, Average Salary, Total Employees, Pending Payments)
  - ✅ Search by employee name, job title, or department
  - ✅ Filter by month, year, and payment status
  - ✅ Detailed payroll table with salary breakdown
  - ✅ Export to CSV functionality
  - ✅ View detailed breakdown modal
  - ✅ Color-coded payment status badges

### 3. **Navigation Integration**
- Added payroll route to App.tsx
- Already present in Sidebar for admin role
- Accessible via sidebar menu

---

## 🚀 Setup Instructions

### Step 1: Run SQL Script to Generate Payroll Data

#### Option A: Via Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/generate_payroll_data.sql`
5. Paste and click **Run**

#### Option B: Via Command Line
```bash
# If you have Supabase CLI installed
supabase db push

# Or manually execute
psql -h your-db-host -U your-db-user -d your-db-name -f supabase/migrations/generate_payroll_data.sql
```

#### Expected Output
```
NOTICE: Payroll data generated successfully!

 total_records | unique_employees | total_payroll | avg_salary
----------------|------------------|---------------|------------
          120  |        20        |   480,000.00  |  4,000.00
```

### Step 2: Verify Data

Run this query in Supabase SQL Editor:
```sql
SELECT 
    p.month,
    p.year,
    pr.full_name,
    p.basic_salary,
    p.net_salary,
    p.payment_status
FROM payroll p
JOIN profiles pr ON p.employee_id = pr.id
ORDER BY p.year DESC, p.month DESC, pr.full_name
LIMIT 10;
```

You should see payroll records for your employees.

---

## 📊 Payroll Salary Structure

### Salary Calculation Formula
```
Basic Salary (varies by job title)
+ Allowances (10-20% of basic)
+ Reimbursements (random 0-500)
- Deductions (5-10% of basic)
- Tax Deducted (10-20% based on salary bracket)
= Net Salary
```

### Salary Ranges by Job Title
- **Manager/Director**: $8,000 - $12,000
- **Senior roles**: $6,000 - $9,000
- **Lead positions**: $5,500 - $8,000
- **Engineer/Developer**: $5,000 - $7,000
- **Analyst**: $4,500 - $6,500
- **Associate/Executive**: $3,500 - $5,000
- **Other positions**: $3,000 - $4,000

### Tax Brackets
- **>$8,000**: 20% tax
- **$5,000-$8,000**: 15% tax
- **<$5,000**: 10% tax

---

## 🎨 UI Features

### Stats Dashboard
- **Total Payroll**: Sum of all net salaries for selected month
- **Average Salary**: Mean salary across all employees
- **Total Employees**: Count of payroll records
- **Pending Payments**: Count of unpaid records

### Filters
1. **Search**: Employee name, job title, or department
2. **Month**: Select month (January - December)
3. **Year**: Select year (2024, 2025)
4. **Status**: All, Processed, Pending, Failed

### Payroll Table Columns
1. Employee (name, job title, department)
2. Basic Salary
3. Allowances (green, with +)
4. Deductions (red, with -)
5. Tax (red, with -)
6. Net Salary (bold)
7. Status (color-coded badge)
8. Actions (View details button)

### Detail Modal
Shows complete breakdown:
- Employee information
- Salary components
- Payment status
- Payment date

### Export CSV
Downloads payroll data as CSV file with name: `payroll_{Month}_{Year}.csv`

---

## 🧪 Testing

### Test 1: View Payroll (November 2024)
1. Login as Admin
2. Click "Payroll" in sidebar
3. Select **November 2024**
4. Should see payroll records with **pending** status

**Expected**: List of employees with pending payments

### Test 2: View Historical Payroll (October 2024)
1. Change month to **October**
2. Should see records with **processed** status

**Expected**: All payments marked as processed

### Test 3: Search Functionality
1. Type employee name in search box
2. Table should filter to show only matching records

**Expected**: Instant filtering

### Test 4: Export CSV
1. Click **Export CSV** button
2. Check Downloads folder

**Expected**: CSV file with format `payroll_November_2024.csv`

### Test 5: View Details
1. Click **View** button on any record
2. Modal should open with detailed breakdown

**Expected**: Modal showing full salary breakdown

### Test 6: Stats Calculation
Check if stats match:
```
Total Payroll = Sum of all Net Salaries
Average Salary = Total Payroll / Total Employees
```

---

## 📁 File Structure

```
hrms/
├── supabase/
│   └── migrations/
│       └── generate_payroll_data.sql    # Payroll data generation
├── src/
│   ├── components/
│   │   └── payroll/
│   │       └── PayrollPage.tsx          # Main payroll component
│   └── App.tsx                           # Route integration
└── PAYROLL_SETUP_GUIDE.md               # This file
```

---

## 🔧 Customization

### Change Salary Ranges
Edit the CASE statement in `generate_payroll_data.sql`:
```sql
basic_sal := CASE 
    WHEN emp_record.job_title ILIKE '%manager%' THEN 10000 + (RANDOM() * 5000)
    -- Add more cases
END;
```

### Change Tax Brackets
Edit the tax calculation:
```sql
tax_val := CASE 
    WHEN basic_sal > 10000 THEN basic_sal * 0.25
    WHEN basic_sal > 7000 THEN basic_sal * 0.20
    ELSE basic_sal * 0.12
END;
```

### Add More Months
Change the loop range:
```sql
FOR month_val IN 1..12 LOOP  -- Full year
```

### Change Payment Status Logic
Edit the status assignment:
```sql
CASE 
    WHEN month_val >= EXTRACT(MONTH FROM CURRENT_DATE) THEN 'pending'::payment_status
    ELSE 'processed'::payment_status
END
```

---

## 🐛 Troubleshooting

### Issue: "No payroll records"
**Solution**: Run the SQL script to generate data

### Issue: "Failed to load payroll"
**Check**:
1. Supabase connection in `.env`
2. RLS policies allow reading payroll table
3. Browser console for errors

### Issue: Stats showing $0
**Check**:
1. Payroll records exist for selected month/year
2. Net salary values are not null
3. No filter is hiding all records

### Issue: Export CSV not working
**Check**:
1. Browser allows downloads
2. Popup blocker not active
3. Sufficient permissions

---

## 🎯 Success Checklist

- [ ] SQL script executed successfully
- [ ] Payroll records visible in database
- [ ] Frontend loads without errors
- [ ] Stats cards show correct totals
- [ ] Search filters work correctly
- [ ] Month/Year filters work
- [ ] Status filter works
- [ ] Table displays all records
- [ ] View details modal opens
- [ ] Export CSV downloads file
- [ ] Payment status badges color-coded correctly

---

## 📊 Sample Data Statistics

After running the script, you should have:
- **120 payroll records** (20 employees × 6 months)
- **June-October 2024**: Status = **Processed**
- **November 2024**: Status = **Pending**
- **Total Payroll** (for November): ~$80,000 - $120,000 (varies by employees)
- **Average Salary**: ~$4,000 - $6,000

---

## 🚀 Quick Start Command

```sql
-- Quick verification query
SELECT 
    COUNT(*) as total,
    COUNT(DISTINCT employee_id) as employees,
    SUM(net_salary) as total_payroll,
    AVG(net_salary) as avg_salary,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending
FROM payroll
WHERE month = 11 AND year = 2024;
```

**Expected Output**:
```
total | employees | total_payroll | avg_salary | pending
------|-----------|---------------|------------|--------
  20  |    20     |   ~100,000    |   ~5,000   |   20
```

---

## ✨ Feature Highlights

✅ **Automated Salary Calculation** - No manual entry needed
✅ **Realistic Data** - Job title-based salaries
✅ **Historical Records** - 6 months of data
✅ **Status Management** - Tracks payment state
✅ **Comprehensive Breakdown** - All salary components
✅ **Search & Filter** - Find records easily
✅ **Export Capability** - Download as CSV
✅ **Responsive Design** - Works on all screens
✅ **Detail View** - Complete record breakdown

---

## 📞 Next Steps

1. **Run SQL script**: Generate payroll data
2. **Start frontend**: `npm run dev`
3. **Login as Admin**: Access payroll feature
4. **Select November 2024**: View pending payments
5. **Test all features**: Search, filter, export, view details

🎉 **You're all set! Payroll feature is ready to use.**
