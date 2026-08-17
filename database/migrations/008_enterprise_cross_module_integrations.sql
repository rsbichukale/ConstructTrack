-- =========================================================================
-- MIGRATION 008: ENTERPRISE CROSS-MODULE INTEGRATIONS
-- =========================================================================

-- 1. Link Snags directly to Flat Tasks
ALTER TABLE snagging_items 
ADD COLUMN IF NOT EXISTS flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE SET NULL;

-- 2. Link Wage Advances to Petty Cash Entries
ALTER TABLE labor_wage_advances 
ADD COLUMN IF NOT EXISTS petty_cash_id BIGINT REFERENCES petty_cash_entries(id) ON DELETE SET NULL;

-- 3. Link Material Outward Records to Specific Flats
ALTER TABLE material_outward_records 
ADD COLUMN IF NOT EXISTS flat_id BIGINT REFERENCES flats(id) ON DELETE SET NULL;

-- 4. Composite Indexes for Fast Cross-Module Lookups
CREATE INDEX IF NOT EXISTS idx_snags_flat_task ON snagging_items(flat_task_id);
CREATE INDEX IF NOT EXISTS idx_wage_advances_petty_cash ON labor_wage_advances(petty_cash_id);
CREATE INDEX IF NOT EXISTS idx_material_outward_flat ON material_outward_records(flat_id);

-- 5. Comprehensive Cross-Module Analytical View: Contractor Financial Health
CREATE OR REPLACE VIEW vw_contractor_financial_health WITH (security_invoker = true) AS
SELECT 
    c.id AS contractor_id,
    c.company_name,
    c.trade_type,
    c.contact_person,
    c.phone,
    COUNT(DISTINCT ft.id) AS total_assigned_tasks,
    COUNT(DISTINCT CASE WHEN ft.status = 'APPROVED' THEN ft.id END) AS approved_tasks,
    COUNT(DISTINCT CASE WHEN ft.status = 'REWORK' THEN ft.id END) AS rework_tasks,
    COALESCE(SUM(CASE WHEN ft.status = 'APPROVED' THEN ft.total_quantity * COALESCE(c.rate_per_sqft, c.rate_per_unit, 25.00) ELSE 0 END), 0) AS estimated_approved_gross_amount,
    COALESCE((SELECT SUM(amount) FROM labor_wage_advances WHERE contractor_id = c.id AND status = 'DISBURSED'), 0) AS unrecovered_wage_advances,
    COALESCE((SELECT SUM(amount) FROM contractor_debit_notes WHERE contractor_id = c.id AND status = 'PENDING'), 0) AS pending_debit_notes,
    COALESCE((SELECT SUM(net_payable_amount) FROM contractor_ra_bills WHERE contractor_id = c.id AND status = 'PAID'), 0) AS total_paid_to_date,
    COALESCE((SELECT SUM(net_payable_amount) FROM contractor_ra_bills WHERE contractor_id = c.id AND status = 'CERTIFIED'), 0) AS certified_unpaid_amount
FROM contractors c
LEFT JOIN flat_tasks ft ON ft.assigned_contractor_id = c.id
GROUP BY c.id, c.company_name, c.trade_type, c.contact_person, c.phone;
