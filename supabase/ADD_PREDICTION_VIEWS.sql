-- ============================================
-- Employee Analytics View for ML Predictions
-- ============================================

-- Drop view if exists
DROP VIEW IF EXISTS employee_analytics CASCADE;

-- Create comprehensive employee analytics view
CREATE OR REPLACE VIEW employee_analytics AS
SELECT 
    p.id as employee_id,
    p.full_name,
    p.email,
    p.department_id,
    d.name as department,
    p.job_title,
    p.date_of_joining,
    p.date_of_birth,
    p.status,
    
    -- Tenure in months
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_joining)) * 12 + 
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.date_of_joining)) as tenure_months,
    
    -- Age
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) as age,
    
    -- Attendance metrics (last 90 days)
    COALESCE(
        (SELECT COUNT(*) * 100.0 / NULLIF(COUNT(DISTINCT date), 0)
         FROM attendance 
         WHERE employee_id = p.id 
         AND date >= CURRENT_DATE - INTERVAL '90 days'
         AND status = 'present'
        ), 85.0
    ) as attendance_rate,
    
    -- Total work hours average (last 90 days)
    COALESCE(
        (SELECT AVG(work_hours)
         FROM attendance 
         WHERE employee_id = p.id 
         AND date >= CURRENT_DATE - INTERVAL '90 days'
         AND work_hours IS NOT NULL
        ), 8.0
    ) as work_hours_avg,
    
    -- Leave days (last 365 days)
    COALESCE(
        (SELECT SUM(total_days)
         FROM leave_requests 
         WHERE employee_id = p.id 
         AND status = 'approved'
         AND start_date >= CURRENT_DATE - INTERVAL '365 days'
        ), 0
    ) as leave_days,
    
    -- Sick leave ratio
    COALESCE(
        (SELECT COUNT(*) * 1.0 / NULLIF(
            (SELECT COUNT(*) FROM leave_requests WHERE employee_id = p.id AND status = 'approved'), 0
        )
         FROM leave_requests 
         WHERE employee_id = p.id 
         AND status = 'approved'
         AND leave_type = 'sick'
        ), 0.2
    ) as sick_leave_ratio,
    
    -- Average performance rating
    COALESCE(
        (SELECT AVG(rating)
         FROM performance_reviews 
         WHERE employee_id = p.id
        ), 3.0
    ) as avg_performance_rating,
    
    -- Latest performance rating
    COALESCE(
        (SELECT rating
         FROM performance_reviews 
         WHERE employee_id = p.id
         ORDER BY review_date DESC
         LIMIT 1
        ), 3.0
    ) as latest_performance_rating,
    
    -- Latest salary
    COALESCE(
        (SELECT net_salary
         FROM payroll 
         WHERE employee_id = p.id
         ORDER BY year DESC, month DESC
         LIMIT 1
        ), 50000.0
    ) as salary,
    
    -- Overtime frequency (days with >9 hours in last 90 days)
    COALESCE(
        (SELECT COUNT(*)
         FROM attendance 
         WHERE employee_id = p.id 
         AND date >= CURRENT_DATE - INTERVAL '90 days'
         AND work_hours > 9
        ), 0
    ) as overtime_frequency,
    
    -- Current attrition risk (if exists)
    COALESCE(
        (SELECT risk_score
         FROM attrition_predictions 
         WHERE employee_id = p.id
         ORDER BY last_updated DESC
         LIMIT 1
        ), NULL
    ) as current_risk_score,
    
    COALESCE(
        (SELECT risk_level
         FROM attrition_predictions 
         WHERE employee_id = p.id
         ORDER BY last_updated DESC
         LIMIT 1
        ), NULL
    ) as current_risk_level

FROM profiles p
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.role = 'employee'  -- Only actual employees, not admins/recruiters
AND p.status = 'active';

-- Grant access to authenticated users
GRANT SELECT ON employee_analytics TO authenticated;

-- Add RLS policy for employee_analytics view
CREATE POLICY "employee_analytics_view_policy" ON employee_analytics
    FOR SELECT
    TO authenticated
    USING (
        -- Admins and senior managers can see all
        public.get_my_role() IN ('admin', 'senior_manager', 'recruiter')
        -- Employees can only see themselves
        OR employee_id = auth.uid()
    );

-- Enable RLS on the view
ALTER VIEW employee_analytics SET (security_invoker = true);

COMMENT ON VIEW employee_analytics IS 'Comprehensive employee analytics for ML predictions and dashboards';
