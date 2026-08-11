-- 1. Sites, Wings, Flats
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE flats (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    wing VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    flat_type VARCHAR(20) DEFAULT '2BHK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, wing, flat_number)
);

-- 2. Contractors & Laborers
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE contractor_trades (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES contractors(id) ON DELETE CASCADE,
    trade_type VARCHAR(50) NOT NULL,
    UNIQUE(contractor_id, trade_type)
);

CREATE TABLE laborers (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES contractors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50) -- 'MASON', 'HELPER', 'LEAD'
);

-- 3. Room Zones & Task Catalog
CREATE TABLE room_zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(50) UNIQUE NOT NULL, -- 'HALL', 'KITCHEN', 'MASTER_BEDROOM', etc.
    zone_label VARCHAR(100) NOT NULL
);

CREATE TABLE task_catalog (
    id SERIAL PRIMARY KEY,
    trade_type VARCHAR(50) NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    room_zone_id INT REFERENCES room_zones(id) ON DELETE CASCADE,
    prerequisite_task_id INT REFERENCES task_catalog(id)
);

-- 4. Flat Tasks Execution Matrix
CREATE TABLE flat_tasks (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id) ON DELETE CASCADE,
    task_catalog_id INT REFERENCES task_catalog(id) ON DELETE CASCADE,
    assigned_contractor_id INT REFERENCES contractors(id),
    status VARCHAR(30) DEFAULT 'NOT_STARTED', -- 'NOT_STARTED', 'IN_PROGRESS', 'INSPECTION_REQUESTED', 'APPROVED', 'REWORK'
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    completion_pct INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flat_id, task_catalog_id)
);

-- 5. Daily Progress Logs & Labor Attendance
CREATE TABLE daily_progress_logs (
    id SERIAL PRIMARY KEY,
    flat_task_id INT REFERENCES flat_tasks(id) ON DELETE CASCADE,
    logged_by_user_id INT NOT NULL,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    labor_count INT DEFAULT 0,
    completion_delta INT NOT NULL,
    photo_url VARCHAR(255),
    notes TEXT
);

CREATE TABLE contractor_attendance (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES contractors(id) ON DELETE CASCADE,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    masons_count INT DEFAULT 0,
    helpers_count INT DEFAULT 0
);