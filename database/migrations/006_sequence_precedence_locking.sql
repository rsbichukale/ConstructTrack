-- ==============================================================================
-- CONSTRUCTTRACK MIGRATION 006: SEQUENCE PRECEDENCE & AUTOMATIC TASK LOCKING
-- ==============================================================================

-- 1. Add sequence_order to task_catalog
ALTER TABLE task_catalog ADD COLUMN IF NOT EXISTS sequence_order INT DEFAULT 1;

-- 2. Add sequence_order to flat_tasks
ALTER TABLE flat_tasks ADD COLUMN IF NOT EXISTS sequence_order INT DEFAULT 1;

-- 3. Seed realistic construction sequence orders in task_catalog based on trade types
-- Sequence 1: Civil / Blockwork
UPDATE task_catalog 
SET sequence_order = 1 
WHERE trade_type IN ('BRICK WORK', 'CIVIL', 'BLOCK WORK', 'MASONRY');

-- Sequence 2: Concealed MEP Chipping & Piping (Parallel Electrical & Plumbing)
UPDATE task_catalog 
SET sequence_order = 2 
WHERE trade_type IN ('ELECTRICAL', 'PLUMBING', 'CONDUIT', 'WATERPROOFING')
  AND (task_name ILIKE '%chipping%' OR task_name ILIKE '%conduit%' OR task_name ILIKE '%pipe%' OR task_name ILIKE '%waterproofing%');

-- Sequence 3: Plastering
UPDATE task_catalog 
SET sequence_order = 3 
WHERE trade_type IN ('PLASTER WORK', 'PLASTER');

-- Sequence 4: POP / Gypsum Punning & False Ceiling
UPDATE task_catalog 
SET sequence_order = 4 
WHERE trade_type IN ('POP', 'GYPSUM', 'FALSE CEILING');

-- Sequence 5: Flooring & Dado Tiles
UPDATE task_catalog 
SET sequence_order = 5 
WHERE trade_type IN ('TILES', 'FLOORING', 'GRANITE');

-- Sequence 6: Carpentry, Doors, Windows & Second Fix MEP
UPDATE task_catalog 
SET sequence_order = 6 
WHERE trade_type IN ('CARPENTRY', 'ALUMINIUM', 'FABRICATION', 'FIXTURES')
   OR (trade_type IN ('ELECTRICAL', 'PLUMBING') AND (task_name ILIKE '%plate%' OR task_name ILIKE '%cp%' OR task_name ILIKE '%fitting%' OR task_name ILIKE '%wire%'));

-- Sequence 7: Final Painting, Polishing & Cleaning
UPDATE task_catalog 
SET sequence_order = 7 
WHERE trade_type IN ('PAINTING', 'CLEANING', 'POLISHING', 'HANDOVER');

-- Synchronize sequence_order to flat_tasks
UPDATE flat_tasks ft
SET sequence_order = tc.sequence_order
FROM task_catalog tc
WHERE ft.task_catalog_id = tc.id;

CREATE INDEX IF NOT EXISTS idx_task_catalog_seq ON task_catalog(room_zone_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_flat_tasks_seq ON flat_tasks(flat_id, sequence_order);
