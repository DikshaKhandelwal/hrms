-- Check if payroll data exists
SELECT COUNT(*) as payroll_count FROM payroll;

-- Check employees
SELECT COUNT(*) as employee_count FROM profiles WHERE status = 'active';

-- If no payroll data, generate it
-- Run this in Supabase SQL Editor to add payroll data

DO $$
DECLARE
    emp_record RECORD;
    month_val INTEGER;
    year_val INTEGER := 2025;  -- Updated to 2025
    basic_sal DECIMAL;
    allowances_val DECIMAL;
    deductions_val DECIMAL;
    tax_val DECIMAL;
    net_sal DECIMAL;
    record_count INTEGER := 0;
BEGIN
    -- Generate payroll for recent months (August 2025 - October 2025)
    FOR month_val IN 8..10 LOOP
        -- For each active employee
        FOR emp_record IN 
            SELECT id, full_name, department_id, job_title
            FROM profiles 
            WHERE status = 'active'
            LIMIT 50  -- Process in batches
        LOOP
            -- Generate salary based on job title
            basic_sal := CASE 
                WHEN emp_record.job_title ILIKE '%director%' OR emp_record.job_title ILIKE '%ceo%' THEN 12000 + (RANDOM() * 5000)
                WHEN emp_record.job_title ILIKE '%manager%' OR emp_record.job_title ILIKE '%head%' THEN 8000 + (RANDOM() * 4000)
                WHEN emp_record.job_title ILIKE '%senior%' OR emp_record.job_title ILIKE '%lead%' THEN 6000 + (RANDOM() * 3000)
                WHEN emp_record.job_title ILIKE '%engineer%' OR emp_record.job_title ILIKE '%developer%' OR emp_record.job_title ILIKE '%analyst%' THEN 5000 + (RANDOM() * 2500)
                WHEN emp_record.job_title ILIKE '%specialist%' OR emp_record.job_title ILIKE '%coordinator%' THEN 4000 + (RANDOM() * 2000)
                ELSE 3500 + (RANDOM() * 1500)
            END;
            
            -- Allowances (Housing, Transport, etc - 15-25% of basic)
            allowances_val := basic_sal * (0.15 + (RANDOM() * 0.10));
            
            -- Deductions (Insurance, loans, etc - 5-8% of basic)
            deductions_val := basic_sal * (0.05 + (RANDOM() * 0.03));
            
            -- Tax (Progressive tax based on salary)
            tax_val := CASE 
                WHEN basic_sal > 10000 THEN basic_sal * 0.25
                WHEN basic_sal > 7000 THEN basic_sal * 0.20
                WHEN basic_sal > 5000 THEN basic_sal * 0.15
                ELSE basic_sal * 0.10
            END;
            
            -- Net salary
            net_sal := basic_sal + allowances_val - deductions_val - tax_val;
            
            -- Insert payroll record
            BEGIN
                INSERT INTO payroll (
                    employee_id,
                    month,
                    year,
                    basic_salary,
                    allowances,
                    deductions,
                    net_salary,
                    payment_date,
                    payment_status,
                    tax_deducted,
                    reimbursements
                ) VALUES (
                    emp_record.id,
                    month_val,
                    year_val,
                    ROUND(basic_sal::numeric, 2),
                    ROUND(allowances_val::numeric, 2),
                    ROUND(deductions_val::numeric, 2),
                    ROUND(net_sal::numeric, 2),
                    MAKE_DATE(year_val, month_val, 28),  -- Payment on 28th of each month
                    'processed'::payment_status,
                    ROUND(tax_val::numeric, 2),
                    ROUND((RANDOM() * 300)::numeric, 2)
                );
                record_count := record_count + 1;
            EXCEPTION
                WHEN unique_violation THEN
                    -- Skip if already exists
                    NULL;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % payroll records', record_count;
END $$;

-- Verify the inserted data
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employee_id) as unique_employees,
    SUM(net_salary) as total_payroll,
    ROUND(AVG(net_salary)::numeric, 2) as avg_salary,
    month,
    year
FROM payroll
GROUP BY month, year
ORDER BY year DESC, month DESC;

-- Show sample records for October 2025
SELECT 
    p.id,
    pr.full_name as employee_name,
    pr.job_title,
    d.name as department,
    p.month,
    p.year,
    p.basic_salary,
    p.allowances,
    p.deductions,
    p.tax_deducted,
    p.net_salary,
    p.payment_status,
    p.payment_date
FROM payroll p
JOIN profiles pr ON p.employee_id = pr.id
LEFT JOIN departments d ON pr.department_id = d.id
WHERE p.month = 10 AND p.year = 2025
ORDER BY p.net_salary DESC
LIMIT 20;
