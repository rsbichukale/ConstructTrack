-- =========================================================================
-- MIGRATION 002: SUBCONTRACTOR RA BILLING ENGINE & SITE AUDIT TRAIL
-- =========================================================================

-- 1. Contractor Running Account (RA) Bills
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

-- 2. RA Bill Line Items (Linked directly to completed flat_tasks)
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

-- 3. Contractor Debit Notes (Material overconsumption, rework penalty)
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

-- 4. Activity Audit Logs (Immutable Compliance & Sign-off Ledger)
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

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_ra_bills_contractor ON contractor_ra_bills(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ra_bills_period ON contractor_ra_bills(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_ra_items_bill ON ra_bill_items(ra_bill_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_contractor ON contractor_debit_notes(contractor_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON activity_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON activity_audit_logs(created_at DESC);
