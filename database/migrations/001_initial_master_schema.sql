-- 001_initial_master_schema.sql
-- Baseline Master Schema for ConstructTrack Local PostgreSQL

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wings Table
CREATE TABLE IF NOT EXISTS wings (
    id BIGINT PRIMARY KEY,
    site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    wing_code VARCHAR(20) NOT NULL,
    wing_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, wing_code)
);

-- 3. Floors Table
CREATE TABLE IF NOT EXISTS floors (
    id BIGINT PRIMARY KEY,
    wing_id BIGINT REFERENCES wings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    wing VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wing_id, floor_number)
);

-- 4. Room Zones Master Table
CREATE TABLE IF NOT EXISTS room_zones (
    id BIGINT PRIMARY KEY,
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    zone_label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trades Master Table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    trade_code VARCHAR(50) UNIQUE NOT NULL,
    trade_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Execution Phases Master Table
CREATE TABLE IF NOT EXISTS execution_phases (
    id BIGINT PRIMARY KEY,
    phase_number INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    trade_type VARCHAR(50),
    estimated_days INT DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Task Catalog Master Table
CREATE TABLE IF NOT EXISTS task_catalog (
    id BIGINT PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    trade_type VARCHAR(50) NOT NULL,
    room_zone_id BIGINT REFERENCES room_zones(id) ON DELETE CASCADE,
    most_likely_days INT DEFAULT 2,
    execution_phase_id BIGINT REFERENCES execution_phases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Contractors Table
CREATE TABLE IF NOT EXISTS contractors (
    id BIGINT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    trade_type VARCHAR(50) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    rate_per_unit NUMERIC(10,2) DEFAULT 0,
    email VARCHAR(100),
    wing_scope VARCHAR(50) DEFAULT 'ALL',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Flats Table
CREATE TABLE IF NOT EXISTS flats (
    id BIGINT PRIMARY KEY,
    site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    flat_number VARCHAR(50) NOT NULL,
    flat_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, wing, flat_number)
);

-- 10. Flat Typology Room Zones Mapping Table
CREATE TABLE IF NOT EXISTS flat_typology_room_zones (
    flat_type VARCHAR(20) NOT NULL,
    room_zone_id BIGINT REFERENCES room_zones(id) ON DELETE CASCADE,
    PRIMARY KEY(flat_type, room_zone_id)
);

-- 11. Flat Unit Micro-Tasks Table
CREATE TABLE IF NOT EXISTS flat_tasks (
    id BIGINT PRIMARY KEY,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    task_catalog_id BIGINT REFERENCES task_catalog(id) ON DELETE CASCADE,
    assigned_contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    completion_pct INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. App Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'site_engineer',
    phone VARCHAR(50),
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    is_email_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. App Roles Master Table
CREATE TABLE IF NOT EXISTS app_roles (
    role_code VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_assignable BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. App Role Workspace Permissions Table
CREATE TABLE IF NOT EXISTS app_role_workspace_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) REFERENCES app_roles(role_code) ON DELETE CASCADE,
    workspace_code VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    UNIQUE(role_code, workspace_code)
);

-- 15. Material Inventory Master Table
CREATE TABLE IF NOT EXISTS material_inventory (
    id BIGINT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock NUMERIC(12,2) DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_reorder_level NUMERIC(12,2) DEFAULT 10,
    reorder_quantity NUMERIC(12,2) DEFAULT 50,
    avg_rate_per_unit NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Material Inward Records Table
CREATE TABLE IF NOT EXISTS material_inward_records (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    item_id BIGINT REFERENCES material_inventory(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity_received NUMERIC(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    challan_no VARCHAR(100),
    supplier_name VARCHAR(200),
    rate_per_unit NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    received_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Material Outward Records Table
CREATE TABLE IF NOT EXISTS material_outward_records (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    item_id BIGINT REFERENCES material_inventory(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity_issued NUMERIC(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    wing VARCHAR(20),
    floor_number INT,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    purpose TEXT,
    issued_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Daily Progress Logs Table
CREATE TABLE IF NOT EXISTS daily_progress_logs (
    id BIGSERIAL PRIMARY KEY,
    flat_task_id BIGINT REFERENCES flat_tasks(id) ON DELETE CASCADE,
    previous_pct INT DEFAULT 0,
    new_pct INT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    remarks TEXT,
    logged_by VARCHAR(100),
    date_logged DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Daily Work Targets Table
CREATE TABLE IF NOT EXISTS daily_work_targets (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    wing VARCHAR(20),
    floor_number INT,
    flat_id BIGINT REFERENCES flats(id) ON DELETE SET NULL,
    target_description TEXT NOT NULL,
    assigned_masons INT DEFAULT 0,
    assigned_helpers INT DEFAULT 0,
    target_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    date_assigned DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Snagging Items Table
CREATE TABLE IF NOT EXISTS snagging_items (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    room_zone_id BIGINT REFERENCES room_zones(id) ON DELETE SET NULL,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'OPEN',
    photo_before TEXT,
    photo_after TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 21. Concrete Cube Tests Table
CREATE TABLE IF NOT EXISTS concrete_cube_tests (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    structural_member VARCHAR(150) NOT NULL,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    concrete_grade VARCHAR(50) NOT NULL,
    supplier_r_m_c VARCHAR(150),
    slump_mm NUMERIC(6,2),
    casting_date DATE NOT NULL,
    test_age_days INT NOT NULL,
    test_date DATE NOT NULL,
    target_strength_mpa NUMERIC(6,2) NOT NULL,
    actual_strength_mpa NUMERIC(6,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Machinery Fleet Logs Table
CREATE TABLE IF NOT EXISTS machinery_logs (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    equipment_name VARCHAR(150) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    registration_no VARCHAR(100),
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

-- 23. Safety Briefings Table
CREATE TABLE IF NOT EXISTS safety_briefings (
    id BIGINT PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    topic VARCHAR(200) NOT NULL,
    speaker_name VARCHAR(100),
    attendee_count INT DEFAULT 0,
    ppe_compliance_pct INT DEFAULT 100,
    briefing_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Visitor Gate Passes Table
CREATE TABLE IF NOT EXISTS visitor_gate_passes (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(30),
    visitor_company VARCHAR(150),
    person_to_meet VARCHAR(100),
    purpose TEXT,
    in_time TIMESTAMPTZ DEFAULT NOW(),
    out_time TIMESTAMPTZ,
    pass_date DATE DEFAULT CURRENT_DATE
);

-- 25. Contractor Attendance Muster Table
CREATE TABLE IF NOT EXISTS contractor_attendance (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
    masons_count INT DEFAULT 0,
    helpers_count INT DEFAULT 0,
    date_logged DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contractor_id, date_logged)
);

-- 26. Department Labor Attendance Table
CREATE TABLE IF NOT EXISTS department_attendance (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    laborer_id BIGINT,
    attendance_status VARCHAR(20) DEFAULT 'PRESENT',
    daily_wage_amount NUMERIC(10,2) DEFAULT 0,
    date_logged DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Petty Cash Register Table
CREATE TABLE IF NOT EXISTS petty_cash_entries (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    entry_type VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    paid_to VARCHAR(150),
    receipt_voucher_no VARCHAR(100),
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Client Variation Changes Table
CREATE TABLE IF NOT EXISTS client_variation_changes (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    flat_id BIGINT REFERENCES flats(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quoted_amount NUMERIC(12,2) DEFAULT 0,
    contractor_cost NUMERIC(12,2) DEFAULT 0,
    developer_margin NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'REQUESTED',
    requested_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. Laborers Master Table
CREATE TABLE IF NOT EXISTS laborers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    skill_level VARCHAR(50) DEFAULT 'HELPER',
    daily_wage_rate NUMERIC(10,2) DEFAULT 600,
    is_department_labor BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Fast Queries
CREATE INDEX IF NOT EXISTS idx_flats_site_wing_floor ON flats(site_id, wing, floor_number);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_flat_id ON flat_tasks(flat_id);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_status ON flat_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dpr_date ON daily_progress_logs(date_logged);
CREATE INDEX IF NOT EXISTS idx_targets_date ON daily_work_targets(date_assigned);
CREATE INDEX IF NOT EXISTS idx_contractor_att_date ON contractor_attendance(date_logged);
CREATE INDEX IF NOT EXISTS idx_inward_date ON material_inward_records(received_date);
CREATE INDEX IF NOT EXISTS idx_outward_date ON material_outward_records(issued_date);
CREATE INDEX IF NOT EXISTS idx_machinery_date ON machinery_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_concrete_date ON concrete_cube_tests(casting_date);
