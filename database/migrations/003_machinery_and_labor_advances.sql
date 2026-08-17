-- =========================================================================
-- MIGRATION 003: MACHINERY ASSETS & LABOR WAGE ADVANCES (KHARCHA)
-- Description: Adds heavy plant & machinery asset registry, fuel efficiency tracking,
--              multi-skill labor muster counts, and weekly labor cash advance ledger.
-- =========================================================================

-- 1. Heavy Machinery Assets Table
CREATE TABLE IF NOT EXISTS machinery_assets (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    asset_name VARCHAR(150) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'TOWER_CRANE' | 'CONCRETE_PUMP' | 'GENSET' | 'EXCAVATOR' | 'TRANSIT_MIXER' | 'PASSENGER_HOIST'
    registration_no VARCHAR(50),
    operator_name VARCHAR(100),
    operator_phone VARCHAR(30),
    status VARCHAR(30) DEFAULT 'OPERATIONAL', -- 'OPERATIONAL' | 'MAINTENANCE' | 'BREAKDOWN' | 'STANDBY'
    total_cumulative_hours NUMERIC(12,2) DEFAULT 0,
    hourly_fuel_benchmark_litres NUMERIC(6,2) DEFAULT 12.00, -- Benchmark L/hr
    service_interval_hours NUMERIC(10,2) DEFAULT 250.00, -- Next service every 250 hrs
    last_service_hours NUMERIC(12,2) DEFAULT 0,
    last_service_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machinery_assets_site_status ON machinery_assets(site_id, status);

-- Seed initial machinery assets if table is empty
INSERT INTO machinery_assets (site_id, asset_name, asset_type, registration_no, operator_name, operator_phone, status, total_cumulative_hours, hourly_fuel_benchmark_litres, service_interval_hours, last_service_hours, last_service_date)
SELECT 1, 'Potain High-Rise Tower Crane TC-01', 'TOWER_CRANE', 'MH-12-TC-9821', 'Ramesh Jadhav', '9876543210', 'OPERATIONAL', 1420.50, 14.50, 250.00, 1250.00, CURRENT_DATE - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM machinery_assets WHERE asset_name = 'Potain High-Rise Tower Crane TC-01');

INSERT INTO machinery_assets (site_id, asset_name, asset_type, registration_no, operator_name, operator_phone, status, total_cumulative_hours, hourly_fuel_benchmark_litres, service_interval_hours, last_service_hours, last_service_date)
SELECT 1, 'Schwing Stetter Concrete Stationary Pump SP-02', 'CONCRETE_PUMP', 'MH-12-CP-4412', 'Vinod Shinde', '9876543211', 'OPERATIONAL', 640.00, 18.00, 200.00, 500.00, CURRENT_DATE - INTERVAL '8 days'
WHERE NOT EXISTS (SELECT 1 FROM machinery_assets WHERE asset_name = 'Schwing Stetter Concrete Stationary Pump SP-02');

INSERT INTO machinery_assets (site_id, asset_name, asset_type, registration_no, operator_name, operator_phone, status, total_cumulative_hours, hourly_fuel_benchmark_litres, service_interval_hours, last_service_hours, last_service_date)
SELECT 1, 'Kirloskar 250 kVA Standby DG Genset', 'GENSET', 'DG-SITE-250KVA', 'Anil Patil', '9876543212', 'OPERATIONAL', 2150.00, 22.00, 300.00, 2000.00, CURRENT_DATE - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM machinery_assets WHERE asset_name = 'Kirloskar 250 kVA Standby DG Genset');

-- 2. Enhanced Machinery Fuel & Run-time Logs
ALTER TABLE machinery_logs ADD COLUMN IF NOT EXISTS asset_id BIGINT REFERENCES machinery_assets(id) ON DELETE SET NULL;
ALTER TABLE machinery_logs ADD COLUMN IF NOT EXISTS fuel_efficiency_litres_per_hour NUMERIC(6,2) DEFAULT 0;
ALTER TABLE machinery_logs ADD COLUMN IF NOT EXISTS excess_fuel_flag BOOLEAN DEFAULT FALSE;

-- 3. Labor Contractor Weekly Wage Advances & Kharcha Table
CREATE TABLE IF NOT EXISTS labor_wage_advances (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT DEFAULT 1,
    contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    advance_voucher_no VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(30) DEFAULT 'CASH', -- 'CASH' | 'UPI' | 'BANK_TRANSFER'
    disbursed_to_leader VARCHAR(150) NOT NULL,
    disbursed_by VARCHAR(100) NOT NULL,
    disbursed_date DATE DEFAULT CURRENT_DATE,
    purpose VARCHAR(150) DEFAULT 'Weekly Food & Kharcha Advance',
    status VARCHAR(30) DEFAULT 'DISBURSED', -- 'DISBURSED' | 'DEDUCTED_IN_RA_BILL' | 'VOID'
    linked_ra_bill_id BIGINT REFERENCES contractor_ra_bills(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_wage_advances_contractor ON labor_wage_advances(contractor_id, status);

-- 4. Multi-Skill Headcount Columns in Contractor Attendance
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS barbenders_count INT DEFAULT 0;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS carpenters_count INT DEFAULT 0;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS electricians_count INT DEFAULT 0;
ALTER TABLE contractor_attendance ADD COLUMN IF NOT EXISTS plumbers_count INT DEFAULT 0;
