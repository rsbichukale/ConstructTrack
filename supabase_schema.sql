-- =========================================================================
-- CONSTRUCTTRACK SUPABASE DATABASE SCHEMA & INITIAL SEEDING
-- Copy and run this entire script in Supabase Dashboard -> SQL Editor
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Flats Table (Wings B1 & B2, 3BHK / 2BHK Mix)
CREATE TABLE IF NOT EXISTS flats (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    flat_type VARCHAR(20) DEFAULT '2BHK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, wing, flat_number)
);

-- 3. Room Zones Table
CREATE TABLE IF NOT EXISTS room_zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    zone_label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Building'
);

-- 4. Contractors Table
CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
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

-- 5. Laborers Registry Table (Contractor & In-House Department Labours)
CREATE TABLE IF NOT EXISTS laborers (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL,
    is_department_labor BOOLEAN DEFAULT FALSE,
    name VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    id_number VARCHAR(50),
    daily_wage_rate NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Task Catalog Master Items
CREATE TABLE IF NOT EXISTS task_catalog (
    id SERIAL PRIMARY KEY,
    trade_type VARCHAR(50) NOT NULL,
    task_name VARCHAR(150) NOT NULL,
    room_zone_id INT REFERENCES room_zones(id) ON DELETE CASCADE,
    prerequisite_task_ids INT[],
    execution_phase_id INT,
    is_building_common BOOLEAN DEFAULT FALSE
);

-- 7. Flat Tasks Execution Matrix
CREATE TABLE IF NOT EXISTS flat_tasks (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id) ON DELETE CASCADE,
    task_catalog_id INT REFERENCES task_catalog(id) ON DELETE CASCADE,
    assigned_contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL,
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

-- 8. Daily Progress Logs
CREATE TABLE IF NOT EXISTS daily_progress_logs (
    id SERIAL PRIMARY KEY,
    flat_task_id INT REFERENCES flat_tasks(id) ON DELETE CASCADE,
    logged_by_user_id INT DEFAULT 1,
    date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    labor_count INT DEFAULT 0,
    completion_delta INT NOT NULL,
    photo_url TEXT,
    notes TEXT
);

-- 9. Contractor-Wise Attendance & Absence Table
CREATE TABLE IF NOT EXISTS contractor_attendance (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES contractors(id) ON DELETE CASCADE,
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

-- 10. In-House Department Helpers Attendance Table
CREATE TABLE IF NOT EXISTS department_attendance (
    id SERIAL PRIMARY KEY,
    laborer_id INT REFERENCES laborers(id) ON DELETE CASCADE,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    work_description TEXT,
    narration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(laborer_id, date_logged)
);

-- 11. Daily Work Targets & Audit Table
CREATE TABLE IF NOT EXISTS daily_work_targets (
    id SERIAL PRIMARY KEY,
    date_assigned DATE NOT NULL DEFAULT CURRENT_DATE,
    contractor_id INT REFERENCES contractors(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Snagging Defect Items Table
CREATE TABLE IF NOT EXISTS snagging_items (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id) ON DELETE CASCADE,
    room_zone_id INT REFERENCES room_zones(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    assigned_contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'OPEN',
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_photo_url TEXT
);

-- 13. Admin Security Credentials Table
CREATE TABLE IF NOT EXISTS admin_credentials (
    id INT PRIMARY KEY DEFAULT 1,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30)
);

-- Insert Default Admin Security Credentials
INSERT INTO admin_credentials (id, username, password_hash, name, email, phone)
VALUES (1, 'admin', 'admin', 'Site Manager & Owner', 'admin@constructtrack.com', '+91 9876543210')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) & Public Access Policies for ConstructTrack
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE laborers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snagging_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create Permissive Anon Policies for App Access
CREATE POLICY "Allow public read-write sites" ON sites FOR ALL USING (true);
CREATE POLICY "Allow public read-write flats" ON flats FOR ALL USING (true);
CREATE POLICY "Allow public read-write room_zones" ON room_zones FOR ALL USING (true);
CREATE POLICY "Allow public read-write contractors" ON contractors FOR ALL USING (true);
CREATE POLICY "Allow public read-write laborers" ON laborers FOR ALL USING (true);
CREATE POLICY "Allow public read-write task_catalog" ON task_catalog FOR ALL USING (true);
CREATE POLICY "Allow public read-write flat_tasks" ON flat_tasks FOR ALL USING (true);
CREATE POLICY "Allow public read-write daily_progress_logs" ON daily_progress_logs FOR ALL USING (true);
CREATE POLICY "Allow public read-write contractor_attendance" ON contractor_attendance FOR ALL USING (true);
CREATE POLICY "Allow public read-write department_attendance" ON department_attendance FOR ALL USING (true);
CREATE POLICY "Allow public read-write daily_work_targets" ON daily_work_targets FOR ALL USING (true);
CREATE POLICY "Allow public read-write snagging_items" ON snagging_items FOR ALL USING (true);
CREATE POLICY "Allow public read-write admin_credentials" ON admin_credentials FOR ALL USING (true);

-- =========================================================================
-- AUTOMATED REPORTING VIEWS FOR DASHBOARDS & ANALYTICS
-- =========================================================================

-- 1. Floor & Wing Level Progress Rollup View
CREATE OR REPLACE VIEW vw_floor_progress_summary AS
SELECT 
    f.wing,
    f.floor_number,
    COUNT(DISTINCT f.id) AS total_flats,
    COUNT(ft.id) AS total_tasks,
    COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END) AS approved_tasks,
    COUNT(CASE WHEN ft.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tasks,
    COUNT(CASE WHEN ft.status = 'INSPECTION_REQUESTED' THEN 1 END) AS inspection_requested_tasks,
    COUNT(CASE WHEN ft.status = 'REWORK' OR ft.blocker_reason IS NOT NULL THEN 1 END) AS rework_tasks,
    ROUND(AVG(ft.completion_pct), 1) AS avg_completion_pct
FROM flats f
LEFT JOIN flat_tasks ft ON f.id = ft.flat_id
GROUP BY f.wing, f.floor_number
ORDER BY f.wing, f.floor_number DESC;

-- 2. Contractor SLA & Execution Performance Matrix
CREATE OR REPLACE VIEW vw_contractor_performance_matrix AS
SELECT 
    c.id AS contractor_id,
    c.company_name,
    c.trade_type,
    COUNT(ft.id) AS total_assigned_tasks,
    COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN ft.status = 'REWORK' THEN 1 END) AS rework_tasks,
    COALESCE(SUM(ft.completed_quantity), 0) AS total_quantity_delivered,
    COALESCE(COUNT(DISTINCT si.id), 0) AS total_snags_logged,
    ROUND(
        CASE WHEN COUNT(ft.id) > 0 
        THEN (COUNT(CASE WHEN ft.status = 'APPROVED' THEN 1 END)::NUMERIC / COUNT(ft.id)::NUMERIC) * 100 
        ELSE 0 END, 1
    ) AS completion_rate_pct
FROM contractors c
LEFT JOIN flat_tasks ft ON c.id = ft.assigned_contractor_id
LEFT JOIN snagging_items si ON c.id = si.assigned_contractor_id AND si.status = 'OPEN'
GROUP BY c.id, c.company_name, c.trade_type;

-- 3. Daily Progress Summary View
CREATE OR REPLACE VIEW vw_daily_site_dpr AS
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

