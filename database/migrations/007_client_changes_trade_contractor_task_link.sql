-- =========================================================================
-- MIGRATION 007: CLIENT CHANGES INTEGRATION WITH CONTRACTOR & MICRO-TASKS
-- =========================================================================

-- 1. Add contractor_id and flat_task_id to client_change_requests
ALTER TABLE client_change_requests 
ADD COLUMN IF NOT EXISTS contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL;

ALTER TABLE client_change_requests 
ADD COLUMN IF NOT EXISTS flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE SET NULL;

-- 2. Add composite and foreign key indexes
CREATE INDEX IF NOT EXISTS idx_client_changes_contractor ON client_change_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_client_changes_flat_task ON client_change_requests(flat_task_id);

-- 3. Update financial and commercial summary view to include contractor name
CREATE OR REPLACE VIEW vw_client_changes_detailed WITH (security_invoker = true) AS
SELECT 
    ccr.id,
    ccr.flat_id,
    COALESCE(ccr.wing, f.wing) AS wing,
    COALESCE(ccr.flat_number::TEXT, f.flat_number::TEXT) AS flat_number,
    f.floor_number,
    f.flat_type,
    ccr.room_zone_id,
    ccr.room_zone_label,
    ccr.trade_type,
    ccr.contractor_id,
    ccr.flat_task_id,
    ccr.change_title,
    ccr.change_description,
    ccr.category,
    ccr.charge_head,
    ccr.quoted_amount,
    ccr.contractor_cost,
    ccr.impact_days,
    ccr.status,
    ccr.requested_by,
    ccr.sales_approval,
    ccr.developer_approval,
    ccr.engineer_approval,
    ccr.settlement,
    ccr.rejection_reason,
    ccr.photo_url,
    ccr.created_at,
    ccr.updated_at,
    c.company_name AS contractor_company_name,
    c.contact_person AS contractor_contact_person,
    c.trade_type AS contractor_trade_type,
    ft.status AS task_status,
    ft.completion_pct AS task_completion_pct
FROM client_change_requests ccr
LEFT JOIN flats f ON f.id = ccr.flat_id
LEFT JOIN contractors c ON c.id = ccr.contractor_id
LEFT JOIN flat_tasks ft ON ft.id = ccr.flat_task_id;
