-- =========================================================================
-- CONSTRUCTTRACK COMPLETE ENTERPRISE MASTER DATABASE SCHEMA (ALL-IN-ONE)
-- Run this single SQL file in Local PostgreSQL SQL Editor to initialize or migrate
-- the entire system (26 Tables, 17 Indexes, 5 Views, Triggers, RLS, & Seeds)
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- SECTION 1: MASTER ASSETS, SPATIAL HIERARCHY & SITES
-- =========================================================================

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Wings Table
CREATE TABLE IF NOT EXISTS wings (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    wing_code VARCHAR(20) NOT NULL,
    wing_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, wing_code)
);

-- 3. Floors Table
CREATE TABLE IF NOT EXISTS floors (
    id BIGSERIAL PRIMARY KEY,
    wing_id BIGINT REFERENCES wings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    wing VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wing_id, floor_number)
);

-- 4. Flats Table (Units Matrix)
CREATE TABLE IF NOT EXISTS flats (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    flat_type VARCHAR(20) DEFAULT '2BHK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, wing, flat_number)
);

-- 5. Room Zones Table
CREATE TABLE IF NOT EXISTS room_zones (
    id BIGSERIAL PRIMARY KEY,
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    zone_label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Building'
);

-- =========================================================================
-- SECTION 2: TRADE CONTRACTORS, LABORERS & MUSTER ROLL
-- =========================================================================

-- 6. Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    trade_code VARCHAR(50) UNIQUE NOT NULL,
    trade_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Contractors Table
CREATE TABLE IF NOT EXISTS contractors (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    trade_type VARCHAR(50) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30) UNIQUE NOT NULL,
    rate_per_unit NUMERIC(10,2) DEFAULT 0,
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    wing_scope VARCHAR(20) DEFAULT 'ALL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Laborers Registry Table
CREATE TABLE IF NOT EXISTS laborers (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    is_department_labor BOOLEAN DEFAULT FALSE,
    name VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    id_number VARCHAR(50),
    daily_wage_rate NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Contractor Attendance Table
CREATE TABLE IF NOT EXISTS contractor_attendance (
    id BIGSERIAL PRIMARY KEY,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    site_id INT DEFAULT 1,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    is_present BOOLEAN DEFAULT TRUE,
    masons_count INT DEFAULT 0,
    helpers_count INT DEFAULT 0,
    absence_reason TEXT,
    work_assigned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contractor_id, date_logged)
);

-- 10. Department Helpers Attendance Table
CREATE TABLE IF NOT EXISTS department_attendance (
    id BIGSERIAL PRIMARY KEY,
    laborer_id BIGINT REFERENCES laborers(id) ON DELETE CASCADE,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    work_description TEXT,
    narration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(laborer_id, date_logged)
);

-- =========================================================================
-- SECTION 3: CIVIL EXECUTION MATRIX, CPM & DPR LOGS
-- =========================================================================

-- 11. Execution Phases (Civil Scheduling CPM)
CREATE TABLE IF NOT EXISTS execution_phases (
    id BIGSERIAL PRIMARY KEY,
    phase_number INT NOT NULL,
    phase_name VARCHAR(150) NOT NULL,
    phase_description TEXT,
    trade_type VARCHAR(100),
    estimated_days INT DEFAULT 3,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    min_hold_days_after_prereq INT DEFAULT 0,
    can_run_parallel_with BIGINT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Task Catalog Master Items
CREATE TABLE IF NOT EXISTS task_catalog (
    id BIGSERIAL PRIMARY KEY,
    trade_type VARCHAR(50) NOT NULL,
    task_name VARCHAR(150) NOT NULL,
    room_zone_id BIGINT REFERENCES room_zones(id) ON DELETE CASCADE,
    prerequisite_task_ids BIGINT[],
    execution_phase_id BIGINT REFERENCES execution_phases(id) ON DELETE SET NULL,
    is_building_common BOOLEAN DEFAULT FALSE,
    optimistic_days NUMERIC,
    most_likely_days NUMERIC,
    pessimistic_days NUMERIC
);

-- 13. Flat Tasks Execution Matrix (3,472 Unit Tasks)
CREATE TABLE IF NOT EXISTS flat_tasks (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    task_catalog_id BIGINT REFERENCES task_catalog(id) ON DELETE CASCADE,
    assigned_contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'NOT_STARTED',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    completion_pct INT DEFAULT 0,
    unit_of_measure VARCHAR(20) DEFAULT 'SQFT',
    total_quantity NUMERIC(10,2) DEFAULT 1000.00,
    completed_quantity NUMERIC(10,2) DEFAULT 0.00,
    blocker_reason TEXT,
    photo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flat_id, task_catalog_id)
);

-- 14. Daily Progress Logs (DPR)
CREATE TABLE IF NOT EXISTS daily_progress_logs (
    id BIGSERIAL PRIMARY KEY,
    flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE CASCADE,
    logged_by_user_id BIGINT DEFAULT 1,
    date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    labor_count INT DEFAULT 0,
    completion_delta INT NOT NULL,
    photo_url TEXT,
    notes TEXT
);

-- 15. Daily Work Targets Table
CREATE TABLE IF NOT EXISTS daily_work_targets (
    id BIGSERIAL PRIMARY KEY,
    date_assigned DATE NOT NULL DEFAULT CURRENT_DATE,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    trade_type VARCHAR(50) NOT NULL,
    target_description TEXT NOT NULL,
    target_quantity_sqft INT DEFAULT 1000,
    planned_labor_count INT DEFAULT 6,
    status VARCHAR(30) DEFAULT 'ASSIGNED',
    actual_completion_pct INT,
    actual_labor_count INT,
    delay_reason TEXT,
    verified_by_supervisor TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Snagging Defect Items Table
CREATE TABLE IF NOT EXISTS snagging_items (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    room_zone_id BIGINT REFERENCES room_zones(id) ON DELETE CASCADE,
    flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    assigned_contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'OPEN',
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_photo_url TEXT,
    inspector_notes TEXT
);

-- =========================================================================
-- SECTION 4: CLIENT CHANGES & 3-TIER COMMERCIAL SETTLEMENT
-- =========================================================================

-- 17. Client Change Requests Table
CREATE TABLE IF NOT EXISTS client_change_requests (
    id BIGINT PRIMARY KEY,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL DEFAULT 'B1',
    flat_number INT,
    room_zone_id BIGINT,
    room_zone_label VARCHAR(100),
    trade_type VARCHAR(100) NOT NULL,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE SET NULL,
    change_title VARCHAR(255) NOT NULL,
    change_description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'PAID_MINOR',
    charge_head VARCHAR(50) NOT NULL DEFAULT 'CLIENT_HEAD',
    quoted_amount NUMERIC(12,2) DEFAULT 0,
    contractor_cost NUMERIC(12,2) DEFAULT 0,
    impact_days INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SALES_APPROVAL',
    requested_by VARCHAR(100) DEFAULT 'Client',
    sales_approval JSONB,
    developer_approval JSONB,
    engineer_approval JSONB,
    settlement JSONB,
    rejection_reason TEXT,
    rejected_by VARCHAR(100),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SECTION 5: SITEOPS ENTERPRISE STORE, CASH, MACHINERY & HSE
-- =========================================================================

-- 18. Material Inventory Table
CREATE TABLE IF NOT EXISTS material_inventory (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_stock NUMERIC(12,2) DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    min_reorder_level NUMERIC(12,2) DEFAULT 0,
    reorder_quantity NUMERIC(12,2) DEFAULT 0,
    avg_rate_per_unit NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Material Inward Records (GRN)
CREATE TABLE IF NOT EXISTS material_inward_records (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(150),
    challan_number VARCHAR(100),
    vehicle_number VARCHAR(50),
    quantity_received NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    rate_per_unit NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    received_date DATE DEFAULT CURRENT_DATE,
    received_by VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Material Outward Records (Issues)
CREATE TABLE IF NOT EXISTS material_outward_records (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    flat_id BIGINT REFERENCES flats(id) ON DELETE SET NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    issued_to_contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    contractor_name VARCHAR(150),
    wing VARCHAR(20),
    floor_number INT,
    purpose VARCHAR(150),
    quantity_issued NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    issued_by VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Petty Cash Entries Table
CREATE TABLE IF NOT EXISTS petty_cash_entries (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    entry_type VARCHAR(30) NOT NULL, -- 'CASH_IN' | 'EXPENSE'
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    paid_to VARCHAR(150),
    description TEXT,
    voucher_number VARCHAR(50),
    bill_receipt_url TEXT,
    entry_date DATE DEFAULT CURRENT_DATE,
    recorded_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Machinery & Fuel Logs Table
CREATE TABLE IF NOT EXISTS machinery_logs (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    equipment_name VARCHAR(150) NOT NULL,
    equipment_type VARCHAR(50) NOT NULL,
    registration_no VARCHAR(50),
    operator_name VARCHAR(100),
    start_hours NUMERIC(10,2) DEFAULT 0,
    end_hours NUMERIC(10,2) DEFAULT 0,
    total_hours NUMERIC(10,2) DEFAULT 0,
    diesel_issued_litres NUMERIC(10,2) DEFAULT 0,
    work_done TEXT,
    location VARCHAR(100),
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Safety Briefings & Incidents Table
CREATE TABLE IF NOT EXISTS safety_briefings (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    topic VARCHAR(200) NOT NULL,
    speaker_name VARCHAR(100),
    attendee_count INT DEFAULT 0,
    ppe_compliance_pct INT DEFAULT 100,
    hazards_identified TEXT,
    incident_type VARCHAR(50) DEFAULT 'NONE',
    briefing_date DATE DEFAULT CURRENT_DATE,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Visitor Gate Passes Table
CREATE TABLE IF NOT EXISTS visitor_gate_passes (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(30),
    visitor_company VARCHAR(150),
    purpose VARCHAR(150),
    person_to_meet VARCHAR(100),
    gate_pass_number VARCHAR(50) UNIQUE,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    vehicle_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Concrete Cube Tests (QA/QC Lab)
CREATE TABLE IF NOT EXISTS concrete_cube_tests (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    structural_member VARCHAR(150) NOT NULL,
    wing VARCHAR(20) DEFAULT 'B1',
    floor_number INT DEFAULT 1,
    concrete_grade VARCHAR(30) NOT NULL,
    supplier_r_m_c VARCHAR(150),
    slump_mm NUMERIC(6,2) DEFAULT 120,
    casting_date DATE NOT NULL,
    test_age_days INT NOT NULL,
    test_date DATE NOT NULL,
    target_strength_mpa NUMERIC(6,2) NOT NULL,
    actual_strength_mpa NUMERIC(6,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PASSED',
    lab_technician VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SECTION 6: AUTHENTICATION & RBAC USERS
-- =========================================================================

-- Application roles are database-managed configuration used by the Admin UI.
CREATE TABLE IF NOT EXISTS app_roles (
    role_code VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_assignable BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_role_workspace_permissions (
    role_code VARCHAR(50) NOT NULL REFERENCES app_roles(role_code) ON DELETE CASCADE,
    workspace_code VARCHAR(50) NOT NULL,
    can_access BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_code, workspace_code)
);

INSERT INTO app_roles (role_code, role_name, description, display_order)
VALUES
    ('admin', 'Administrator', 'Full system administration', 10),
    ('developer', 'Builder / Developer', 'Commercial approvals and project oversight', 20),
    ('site_engineer', 'Site Engineer', 'Execution, inspection, and daily reporting', 30),
    ('supervisor', 'Supervisor', 'Site supervision and progress reporting', 40),
    ('contractor', 'Trade Contractor', 'Assigned contractor work', 50),
    ('billing', 'QS & Billing', 'Measurements, billing, and claims', 60),
    ('sales', 'Sales & CRM', 'Client changes and handover', 70),
    ('quality_inspector', 'Quality Inspector', 'QA/QC and snagging', 80)
ON CONFLICT (role_code) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

INSERT INTO app_role_workspace_permissions (role_code, workspace_code)
VALUES
    ('admin', 'execution'), ('admin', 'workforce'), ('admin', 'materials'), ('admin', 'finance'), ('admin', 'sales'), ('admin', 'safety_qa'), ('admin', 'admin'),
    ('developer', 'execution'), ('developer', 'workforce'), ('developer', 'materials'), ('developer', 'finance'), ('developer', 'sales'), ('developer', 'safety_qa'),
    ('site_engineer', 'execution'), ('site_engineer', 'workforce'), ('site_engineer', 'materials'), ('site_engineer', 'finance'), ('site_engineer', 'safety_qa'),
    ('supervisor', 'execution'), ('supervisor', 'workforce'),
    ('contractor', 'execution'),
    ('billing', 'workforce'), ('billing', 'materials'), ('billing', 'finance'), ('billing', 'sales'),
    ('sales', 'sales'),
    ('quality_inspector', 'execution'), ('quality_inspector', 'safety_qa')
ON CONFLICT (role_code, workspace_code) DO UPDATE SET can_access = TRUE;

-- Enable RLS and public read policies on app_roles & permissions
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of app_roles" ON app_roles;
CREATE POLICY "Allow public read of app_roles" ON app_roles FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE app_role_workspace_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of app_role_workspace_permissions" ON app_role_workspace_permissions;
CREATE POLICY "Allow public read of app_role_workspace_permissions" ON app_role_workspace_permissions FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON TABLE app_roles TO anon, authenticated;
GRANT SELECT ON TABLE app_role_workspace_permissions TO anon, authenticated;
GRANT SELECT ON TABLE sites TO anon, authenticated;
GRANT SELECT ON TABLE wings TO anon, authenticated;
GRANT SELECT ON TABLE floors TO anon, authenticated;
GRANT SELECT ON TABLE flats TO anon, authenticated;
GRANT SELECT ON TABLE room_zones TO anon, authenticated;
GRANT SELECT ON TABLE trades TO anon, authenticated;
GRANT SELECT ON TABLE execution_phases TO anon, authenticated;
GRANT SELECT ON TABLE task_catalog TO anon, authenticated;

-- 26. App Users Table (Local PostgreSQL Auth & RBAC Profile Mirror)
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'site_engineer',
    phone VARCHAR(30),
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App User Roles Mapping Table
CREATE TABLE IF NOT EXISTS app_user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES app_users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flat typology-to-room configuration used by the setup wizard.
CREATE TABLE IF NOT EXISTS flat_typology_room_zones (
    flat_type VARCHAR(50) NOT NULL,
    room_zone_id BIGINT NOT NULL REFERENCES room_zones(id) ON DELETE CASCADE,
    PRIMARY KEY (flat_type, room_zone_id)
);

-- =========================================================================
-- SECTION 7: HIGH-PERFORMANCE COMPOSITE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_flat_tasks_flat_status ON flat_tasks(flat_id, status);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_contractor_status ON flat_tasks(assigned_contractor_id, status);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_catalog ON flat_tasks(task_catalog_id);
CREATE INDEX IF NOT EXISTS idx_flats_wing_floor ON flats(wing, floor_number);
CREATE INDEX IF NOT EXISTS idx_daily_progress_logs_task_date ON daily_progress_logs(flat_task_id, date_logged);
CREATE INDEX IF NOT EXISTS idx_contractor_attendance_date ON contractor_attendance(contractor_id, date_logged);
CREATE INDEX IF NOT EXISTS idx_department_attendance_date ON department_attendance(laborer_id, date_logged);
CREATE INDEX IF NOT EXISTS idx_client_changes_flat_status ON client_change_requests(flat_id, status);
CREATE INDEX IF NOT EXISTS idx_client_changes_charge_head ON client_change_requests(charge_head);
CREATE INDEX IF NOT EXISTS idx_client_changes_contractor ON client_change_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_client_changes_flat_task ON client_change_requests(flat_task_id);
CREATE INDEX IF NOT EXISTS idx_material_inward_date ON material_inward_records(site_id, received_date);
CREATE INDEX IF NOT EXISTS idx_material_outward_date ON material_outward_records(site_id, issued_date);
CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON petty_cash_entries(site_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_machinery_logs_date ON machinery_logs(site_id, log_date);
CREATE INDEX IF NOT EXISTS idx_safety_briefings_date ON safety_briefings(site_id, briefing_date);
CREATE INDEX IF NOT EXISTS idx_visitor_gate_passes_entry ON visitor_gate_passes(entry_time);
CREATE INDEX IF NOT EXISTS idx_concrete_cube_tests_date ON concrete_cube_tests(site_id, test_date);
CREATE INDEX IF NOT EXISTS idx_app_users_username_email ON app_users(username, email);
CREATE INDEX IF NOT EXISTS idx_app_users_contractor ON app_users(contractor_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user ON app_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_typology_room_zone ON flat_typology_room_zones(room_zone_id, flat_type);

-- =========================================================================
-- SECTION 8: AUTOMATED ANALYTICAL REPORTING VIEWS
-- =========================================================================

-- View 1: Floor & Wing Level Progress Rollup
CREATE OR REPLACE VIEW vw_floor_progress_summary WITH (security_invoker = true) AS
SELECT 
    f.wing,
    f.floor_number,
    COUNT(DISTINCT f.id) AS total_flats,
    COUNT(ft.id) AS total_tasks,
    COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END) AS approved_tasks,
    COUNT(CASE WHEN ft.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
    COUNT(CASE WHEN ft.status = 'INSPECTION_REQUESTED' THEN 1 END) AS inspection_requested_tasks,
    COUNT(CASE WHEN ft.status = 'REWORK' OR ft.blocker_reason IS NOT NULL THEN 1 END) AS rework_tasks,
    ROUND(COALESCE(AVG(ft.completion_pct), 0), 1) AS avg_completion_pct
FROM flats f
LEFT JOIN flat_tasks ft ON f.id = ft.flat_id
GROUP BY f.wing, f.floor_number
ORDER BY f.wing, f.floor_number DESC;

-- View 2: Contractor SLA Performance Matrix
CREATE OR REPLACE VIEW vw_contractor_performance_matrix WITH (security_invoker = true) AS
SELECT 
    c.id AS contractor_id,
    c.company_name,
    c.trade_type,
    COUNT(ft.id) AS total_assigned_tasks,
    COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN ft.status = 'REWORK' THEN 1 END) AS rework_tasks,
    ROUND(COALESCE(AVG(ft.completion_pct), 0), 1) AS avg_progress_pct,
    ROUND(
        CASE WHEN COUNT(ft.id) > 0 
        THEN (COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END)::NUMERIC / COUNT(ft.id)::NUMERIC) * 100 
        ELSE 0 END, 1
    ) AS completion_rate_pct
FROM contractors c
LEFT JOIN flat_tasks ft ON c.id = ft.assigned_contractor_id
GROUP BY c.id, c.company_name, c.trade_type;

-- View 3: Daily Progress Summary (DPR)
CREATE OR REPLACE VIEW vw_daily_site_dpr WITH (security_invoker = true) AS
SELECT 
    dpl.date_logged::DATE AS report_date,
    COUNT(DISTINCT dpl.id) AS total_updates_logged,
    SUM(dpl.labor_count) AS total_labor_deployed,
    SUM(dpl.completion_delta) AS cumulative_progress_delta,
    COUNT(DISTINCT ft.flat_id) AS flats_worked_on
FROM daily_progress_logs dpl
JOIN flat_tasks ft ON dpl.flat_task_id = ft.id
GROUP BY dpl.date_logged::DATE
ORDER BY report_date DESC;

-- View 4: Client Changes & Commercial Margin View
CREATE OR REPLACE VIEW vw_client_changes_financial_summary WITH (security_invoker = true) AS
SELECT 
    charge_head,
    COUNT(*) AS total_requests,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS settled_requests,
    COUNT(CASE WHEN status = 'APPROVED_FOR_EXECUTION' THEN 1 END) AS in_execution_requests,
    COUNT(CASE WHEN status LIKE 'PENDING_%' THEN 1 END) AS pending_approval_requests,
    COALESCE(SUM(quoted_amount), 0) AS total_quoted_revenue,
    COALESCE(SUM(contractor_cost), 0) AS total_contractor_cost,
    COALESCE(SUM(quoted_amount - contractor_cost), 0) AS net_commercial_margin
FROM client_change_requests
GROUP BY charge_head;

-- View 4b: Detailed Client Changes with Contractor & Micro-Task Execution Tracking
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

-- View 5: SiteOps Daily KPIs Overview
CREATE OR REPLACE VIEW vw_siteops_daily_kpis WITH (security_invoker = true) AS
SELECT 
    (SELECT COALESCE(SUM(total_amount), 0) FROM material_inward_records WHERE received_date = CURRENT_DATE) AS materials_inward_today_amount,
    (SELECT COALESCE(SUM(amount), 0) FROM petty_cash_entries WHERE entry_date = CURRENT_DATE AND entry_type = 'EXPENSE') AS cash_expenses_today,
    (SELECT COALESCE(SUM(total_hours), 0) FROM machinery_logs WHERE log_date = CURRENT_DATE) AS machinery_hours_today,
    (SELECT COUNT(*) FROM visitor_gate_passes WHERE entry_time::DATE = CURRENT_DATE) AS visitors_count_today,
    (SELECT COUNT(*) FROM safety_briefings WHERE briefing_date = CURRENT_DATE) AS safety_briefings_today;

-- =========================================================================
-- SECTION 9: AUTOMATED FUNCTIONS & TRIGGERS
-- =========================================================================

-- Function 1: Generic Auto-Update Timestamp
CREATE OR REPLACE FUNCTION fn_auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_flats_updated_at ON flats;
CREATE TRIGGER trg_flats_updated_at BEFORE UPDATE ON flats FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_flat_tasks_updated_at ON flat_tasks;
CREATE TRIGGER trg_flat_tasks_updated_at BEFORE UPDATE ON flat_tasks FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_client_change_requests_updated_at ON client_change_requests;
CREATE TRIGGER trg_client_change_requests_updated_at BEFORE UPDATE ON client_change_requests FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_material_inventory_updated_at ON material_inventory;
CREATE TRIGGER trg_material_inventory_updated_at BEFORE UPDATE ON material_inventory FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON app_users;
CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

-- Function 2: Automatic Stock Addition on Material Inward (GRN)
CREATE OR REPLACE FUNCTION fn_trg_inventory_inward()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO material_inventory (site_id, item_name, category, current_stock, unit, avg_rate_per_unit, updated_at)
    VALUES (NEW.site_id, NEW.item_name, NEW.category, NEW.quantity_received, NEW.unit, NEW.rate_per_unit, NOW())
    ON CONFLICT (id) DO UPDATE
    SET current_stock = material_inventory.current_stock + NEW.quantity_received,
        avg_rate_per_unit = CASE WHEN NEW.rate_per_unit > 0 THEN NEW.rate_per_unit ELSE material_inventory.avg_rate_per_unit END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_inward_inventory ON material_inward_records;
CREATE TRIGGER trg_material_inward_inventory AFTER INSERT ON material_inward_records FOR EACH ROW EXECUTE FUNCTION fn_trg_inventory_inward();

-- Function 3: Automatic Stock Deduction on Material Outward (Issue)
CREATE OR REPLACE FUNCTION fn_trg_inventory_outward()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE material_inventory
    SET current_stock = GREATEST(0, current_stock - NEW.quantity_issued),
        updated_at = NOW()
    WHERE item_name = NEW.item_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_outward_inventory ON material_outward_records;
CREATE TRIGGER trg_material_outward_inventory AFTER INSERT ON material_outward_records FOR EACH ROW EXECUTE FUNCTION fn_trg_inventory_outward();

-- Function 4: Automatic Mirroring of Local PostgreSQL auth.users to public.app_users
CREATE OR REPLACE FUNCTION public.fn_sync_auth_user_to_public()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    user_phone TEXT;
    user_contractor BIGINT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.app_users WHERE id = OLD.id::TEXT OR email = OLD.email;
        RETURN OLD;
    END IF;

    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'full_name', 
        split_part(NEW.email, '@', 1)
    );
    
    user_role := COALESCE(
        NEW.raw_app_meta_data->>'constructtrack_role',
        NEW.raw_app_meta_data->>'role',
        'site_engineer'
    );
    IF user_role NOT IN ('admin', 'developer', 'site_engineer', 'supervisor', 'contractor', 'billing', 'sales', 'quality_inspector') THEN
        user_role := 'site_engineer';
    END IF;

    user_phone := COALESCE(
        NEW.raw_user_meta_data->>'phone',
        NEW.phone
    );

    IF (NEW.raw_app_meta_data->>'contractor_id' ~ '^[0-9]+$') THEN
        user_contractor := (NEW.raw_app_meta_data->>'contractor_id')::BIGINT;
    ELSE
        user_contractor := NULL;
    END IF;

    INSERT INTO public.app_users (
        id,
        username,
        email,
        name,
        role,
        phone,
        contractor_id,
        is_email_verified,
        invited_at,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        NEW.id::TEXT,
        split_part(NEW.email, '@', 1),
        NEW.email,
        user_name,
        user_role,
        user_phone,
        user_contractor,
        (NEW.email_confirmed_at IS NOT NULL OR (NEW.raw_user_meta_data->>'email_verified')::BOOLEAN IS TRUE),
        COALESCE(NEW.created_at, NOW()),
        NEW.last_sign_in_at,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        contractor_id = EXCLUDED.contractor_id,
        is_email_verified = EXCLUDED.is_email_verified,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.fn_sync_auth_user_to_public() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_auth_user_insert ON auth.users;
CREATE TRIGGER trg_sync_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_auth_user_to_public();

DROP TRIGGER IF EXISTS trg_sync_auth_user_update ON auth.users;
CREATE TRIGGER trg_sync_auth_user_update
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_auth_user_to_public();

DROP TRIGGER IF EXISTS trg_sync_auth_user_delete ON auth.users;
CREATE TRIGGER trg_sync_auth_user_delete
AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_auth_user_to_public();

-- =========================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE laborers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snagging_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inward_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_outward_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concrete_cube_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_role_workspace_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_typology_room_zones ENABLE ROW LEVEL SECURITY;

-- Browser clients and mobile clients access data with authenticated and anon sessions.
-- Grant access and define permissive RLS policies on all operational tables.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Public RLS access policy for all public tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated and anon on %I" ON public.%I;', tbl.tablename, tbl.tablename);
-- =========================================================================
-- SECTION 6: SUBCONTRACTOR RA BILLING ENGINE & SITE AUDIT TRAIL
-- =========================================================================

-- 30. Contractor Running Account (RA) Bills
CREATE TABLE IF NOT EXISTS contractor_ra_bills (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    gross_amount NUMERIC(12,2) DEFAULT 0,
    retention_pct NUMERIC(5,2) DEFAULT 5.00,
    retention_amount NUMERIC(12,2) DEFAULT 0,
    tds_pct NUMERIC(5,2) DEFAULT 1.00,
    tds_amount NUMERIC(12,2) DEFAULT 0,
    labor_cess_pct NUMERIC(5,2) DEFAULT 1.00,
    labor_cess_amount NUMERIC(12,2) DEFAULT 0,
    debit_notes_deducted NUMERIC(12,2) DEFAULT 0,
    net_payable_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT' | 'SUBMITTED' | 'CERTIFIED' | 'PAID'
    certified_by VARCHAR(100),
    certified_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. RA Bill Line Items (Linked directly to completed flat_tasks)
CREATE TABLE IF NOT EXISTS ra_bill_items (
    id BIGSERIAL PRIMARY KEY,
    ra_bill_id BIGINT REFERENCES contractor_ra_bills(id) ON DELETE CASCADE,
    flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) DEFAULT 1.00,
    unit VARCHAR(30) DEFAULT 'JOB',
    rate NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. Contractor Debit Notes (Material overconsumption, rework penalty)
CREATE TABLE IF NOT EXISTS contractor_debit_notes (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
    debit_note_number VARCHAR(100) UNIQUE NOT NULL,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    ra_bill_id BIGINT REFERENCES contractor_ra_bills(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'MATERIAL_OVERUSE' | 'DEFECT_PENALTY' | 'SAFETY_VIOLATION'
    amount NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING' | 'DEDUCTED' | 'WAIVED'
    issued_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Activity Audit Logs (Immutable Compliance & Sign-off Ledger)
CREATE TABLE IF NOT EXISTS activity_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'TASK' | 'MATERIAL' | 'PETTY_CASH' | 'CLIENT_CHANGE' | 'RA_BILL' | 'USER'
    entity_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CERTIFY' | 'REJECT'
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    previous_state JSONB,
    new_state JSONB,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ra_bills_contractor ON contractor_ra_bills(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ra_bills_period ON contractor_ra_bills(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_ra_items_bill ON ra_bill_items(ra_bill_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_contractor ON contractor_debit_notes(contractor_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON activity_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON activity_audit_logs(created_at DESC);

-- =========================================================================
-- SECTION 8: MACHINERY FLEET ASSETS & LABOR WAGE ADVANCES
-- =========================================================================

-- 34. Heavy Machinery Assets Table
CREATE TABLE IF NOT EXISTS machinery_assets (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    asset_name VARCHAR(150) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    registration_no VARCHAR(50),
    operator_name VARCHAR(100),
    operator_phone VARCHAR(30),
    status VARCHAR(30) DEFAULT 'OPERATIONAL',
    total_cumulative_hours NUMERIC(12,2) DEFAULT 0,
    hourly_fuel_benchmark_litres NUMERIC(6,2) DEFAULT 12.00,
    service_interval_hours NUMERIC(10,2) DEFAULT 250.00,
    last_service_hours NUMERIC(12,2) DEFAULT 0,
    last_service_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machinery_assets_site_status ON machinery_assets(site_id, status);

-- 35. Labor Wage Advances (Kharcha) Table
CREATE TABLE IF NOT EXISTS labor_wage_advances (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    petty_cash_id BIGINT REFERENCES petty_cash_entries(id) ON DELETE SET NULL,
    advance_voucher_no VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(30) DEFAULT 'CASH',
    disbursed_to_leader VARCHAR(150) NOT NULL,
    disbursed_by VARCHAR(100) NOT NULL,
    disbursed_date DATE DEFAULT CURRENT_DATE,
    purpose VARCHAR(150) DEFAULT 'Weekly Food & Kharcha Advance',
    status VARCHAR(30) DEFAULT 'DISBURSED',
    linked_ra_bill_id BIGINT REFERENCES contractor_ra_bills(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_wage_advances_contractor ON labor_wage_advances(contractor_id, status);
CREATE INDEX IF NOT EXISTS idx_wage_advances_petty_cash ON labor_wage_advances(petty_cash_id);

-- View: Contractor Comprehensive Financial Health (Billing, Advances, Debit Notes)
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

-- =========================================================================
-- SECTION 9: FLAT ROOM DIMENSIONS & TASK LIFECYCLE
-- =========================================================================

-- 36. Flat Room Dimensions & BOQ Quantities Table
CREATE TABLE IF NOT EXISTS flat_room_dimensions (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
    flat_id BIGINT NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    room_zone_id BIGINT NOT NULL REFERENCES room_zones(id) ON DELETE CASCADE,
    length_ft NUMERIC(8,2) NOT NULL DEFAULT 12.00,
    width_ft NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    height_ft NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    door_window_deduction_sqft NUMERIC(8,2) NOT NULL DEFAULT 25.00,
    flooring_area_sqft NUMERIC(8,2) GENERATED ALWAYS AS (length_ft * width_ft) STORED,
    wall_area_sqft NUMERIC(8,2) GENERATED ALWAYS AS (GREATEST(0, (2 * (length_ft + width_ft) * height_ft) - door_window_deduction_sqft)) STORED,
    ceiling_area_sqft NUMERIC(8,2) GENERATED ALWAYS AS (length_ft * width_ft) STORED,
    skirting_rft NUMERIC(8,2) GENERATED ALWAYS AS (GREATEST(0, 2 * (length_ft + width_ft) - 3.00)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flat_id, room_zone_id)
);

CREATE INDEX IF NOT EXISTS idx_flat_room_dim_flat ON flat_room_dimensions(flat_id);
CREATE INDEX IF NOT EXISTS idx_flat_room_dim_zone ON flat_room_dimensions(room_zone_id);

-- =========================================================================
-- SECTION 10: FLOOR PLAN & FLAT TYPOLOGY TEMPLATES (2BHK / 3BHK)
-- =========================================================================

-- 37. Typology Room Dimensions Template Table
CREATE TABLE IF NOT EXISTS typology_room_templates (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
    flat_type VARCHAR(50) NOT NULL,
    room_zone_id BIGINT NOT NULL REFERENCES room_zones(id) ON DELETE CASCADE,
    length_ft NUMERIC(8,2) NOT NULL DEFAULT 14.00,
    width_ft NUMERIC(8,2) NOT NULL DEFAULT 12.00,
    height_ft NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    door_window_deduction_sqft NUMERIC(8,2) NOT NULL DEFAULT 25.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, flat_type, room_zone_id)
);

CREATE INDEX IF NOT EXISTS idx_typology_templates_type ON typology_room_templates(site_id, flat_type);
CREATE INDEX IF NOT EXISTS idx_task_catalog_seq ON task_catalog(room_zone_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_seq ON flat_tasks(flat_id, sequence_order);
