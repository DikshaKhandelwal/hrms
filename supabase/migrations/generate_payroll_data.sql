-- Generate Sample Payroll Data
-- This script creates payroll records for all existing employees

-- First, let's check what employees we have
DO $$
DECLARE
    emp_record RECORD;
    month_val INTEGER;
    year_val INTEGER := 2024;
    basic_sal DECIMAL;
    allowances_val DECIMAL;
    deductions_val DECIMAL;
    tax_val DECIMAL;
    net_sal DECIMAL;
BEGIN
    -- Generate payroll for the last 6 months (June 2024 - October 2024 + November 2024)
    FOR month_val IN 6..11 LOOP
        -- For each employee
        FOR emp_record IN 
            SELECT id, full_name, department_id, job_title
            FROM profiles 
            WHERE status = 'active'
        LOOP
            -- Generate varied but realistic salary data based on job title
            basic_sal := CASE 
                WHEN emp_record.job_title ILIKE '%manager%' OR emp_record.job_title ILIKE '%director%' THEN 8000 + (RANDOM() * 4000)
                WHEN emp_record.job_title ILIKE '%senior%' THEN 6000 + (RANDOM() * 3000)
                WHEN emp_record.job_title ILIKE '%lead%' THEN 5500 + (RANDOM() * 2500)
                WHEN emp_record.job_title ILIKE '%engineer%' OR emp_record.job_title ILIKE '%developer%' THEN 5000 + (RANDOM() * 2000)
                WHEN emp_record.job_title ILIKE '%analyst%' THEN 4500 + (RANDOM() * 2000)
                WHEN emp_record.job_title ILIKE '%associate%' OR emp_record.job_title ILIKE '%executive%' THEN 3500 + (RANDOM() * 1500)
                ELSE 3000 + (RANDOM() * 1000)
            END;
            
            -- Calculate allowances (10-20% of basic salary)
            allowances_val := basic_sal * (0.10 + (RANDOM() * 0.10));
            
            -- Calculate deductions (medical, transport, etc - 5-10% of basic)
            deductions_val := basic_sal * (0.05 + (RANDOM() * 0.05));
            
            -- Calculate tax (simplified - 10-20% based on salary bracket)
            tax_val := CASE 
                WHEN basic_sal > 8000 THEN basic_sal * 0.20
                WHEN basic_sal > 5000 THEN basic_sal * 0.15
                ELSE basic_sal * 0.10
            END;
            
            -- Calculate net salary
            net_sal := basic_sal + allowances_val - deductions_val - tax_val;
            
            -- Insert payroll record (check if not already exists)
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
                MAKE_DATE(year_val, month_val, CASE 
                    WHEN month_val = 11 THEN LEAST(30, EXTRACT(DAY FROM CURRENT_DATE)::INTEGER)
                    ELSE 28 
                END),
                CASE 
                    WHEN month_val = 11 THEN 'pending'::payment_status
                    ELSE 'processed'::payment_status
                END,
                ROUND(tax_val::numeric, 2),
                ROUND((RANDOM() * 500)::numeric, 2) -- Random reimbursements 0-500
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Payroll data generated successfully!';
END $$;

-- Verify the data
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employee_id) as unique_employees,
    SUM(net_salary) as total_payroll,
    AVG(net_salary) as avg_salary
FROM payroll;

-- Show sample records
SELECT 
    p.month,
    p.year,
    pr.full_name as employee_name,
    pr.job_title,
    p.basic_salary,
    p.allowances,
    p.deductions,
    p.tax_deducted,
    p.net_salary,
    p.payment_status
FROM payroll p
JOIN profiles pr ON p.employee_id = pr.id
ORDER BY p.year DESC, p.month DESC, pr.full_name
LIMIT 20;
