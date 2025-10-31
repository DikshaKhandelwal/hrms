-- QUICK PAYROLL DATA FIX
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Check current state
SELECT 'Current payroll records:' as info, COUNT(*) as count FROM payroll
UNION ALL
SELECT 'Active employees:', COUNT(*) FROM profiles WHERE status = 'active';

-- Step 2: Add payroll data for October 2025
DO $$
DECLARE
    emp RECORD;
    salary DECIMAL;
    allow DECIMAL;
    deduct DECIMAL;
    tax DECIMAL;
    net DECIMAL;
    record_count INT := 0;
    status_val VARCHAR;
    payment_dt DATE;
BEGIN
    FOR emp IN SELECT id, full_name, job_title FROM profiles WHERE status = 'active' LIMIT 50
    LOOP
        record_count := record_count + 1;
        
        -- Calculate salary
        salary := CASE 
            WHEN emp.job_title ILIKE '%manager%' THEN 8000 + RANDOM() * 4000
            WHEN emp.job_title ILIKE '%senior%' THEN 6000 + RANDOM() * 3000
            WHEN emp.job_title ILIKE '%engineer%' THEN 5000 + RANDOM() * 2500
            ELSE 4000 + RANDOM() * 2000
        END;
        
        allow := salary * 0.20;
        deduct := salary * 0.06;
        tax := salary * 0.15;
        net := salary + allow - deduct - tax;
        
        -- Make first 2 records "pending" status, rest "processed"
        IF record_count <= 2 THEN
            status_val := 'pending';
            payment_dt := NULL;
        ELSE
            status_val := 'processed';
            payment_dt := '2025-10-28';
        END IF;
        
        INSERT INTO payroll (
            employee_id, month, year, basic_salary, allowances, 
            deductions, tax_deducted, net_salary, payment_date, payment_status, reimbursements
        ) VALUES (
            emp.id, 10, 2025, 
            ROUND(salary::numeric, 2), 
            ROUND(allow::numeric, 2),
            ROUND(deduct::numeric, 2), 
            ROUND(tax::numeric, 2), 
            ROUND(net::numeric, 2),
            payment_dt, status_val::payment_status, 
            ROUND((RANDOM() * 200)::numeric, 2)
        ) ON CONFLICT (employee_id, month, year) DO NOTHING;
    END LOOP;
END $$;

-- Step 3: Verify
SELECT 
    'Payroll records created for October 2025:' as info,
    COUNT(*) as count,
    ROUND(SUM(net_salary)::numeric, 2) as total_payroll,
    ROUND(AVG(net_salary)::numeric, 2) as avg_salary
FROM payroll 
WHERE month = 10 AND year = 2025;

-- Step 4: Show sample data
SELECT 
    pr.full_name,
    pr.job_title,
    p.basic_salary,
    p.allowances,
    p.deductions,
    p.tax_deducted,
    p.net_salary,
    p.payment_status
FROM payroll p
JOIN profiles pr ON p.employee_id = pr.id
WHERE p.month = 10 AND p.year = 2025
ORDER BY p.net_salary DESC
LIMIT 10;
