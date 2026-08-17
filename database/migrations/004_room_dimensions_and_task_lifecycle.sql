-- ==============================================================================
-- CONSTRUCTTRACK MIGRATION 004: ROOM DIMENSIONS BOQ & MULTI-STAGE TASK LIFECYCLE
-- ==============================================================================

-- 1. Create flat_room_dimensions table
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

-- 2. Add lifecycle timestamp columns to flat_tasks
ALTER TABLE flat_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE flat_tasks ADD COLUMN IF NOT EXISTS inspection_requested_at TIMESTAMPTZ;
ALTER TABLE flat_tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Ensure contractors table has registered trade unit rate column
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS rate_per_sqft NUMERIC(10,2) DEFAULT 25.00;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS rate_per_unit NUMERIC(10,2) DEFAULT 25.00;

-- 4. Seed initial default room dimensions for all 70 flats and 11 room zones
DO $$
DECLARE
  f RECORD;
  rz RECORD;
  l NUMERIC(8,2);
  w NUMERIC(8,2);
  h NUMERIC(8,2) := 10.00;
  ded NUMERIC(8,2) := 25.00;
BEGIN
  FOR f IN SELECT id, flat_type FROM flats LOOP
    FOR rz IN SELECT id, zone_code FROM room_zones LOOP
      -- Set realistic dimensions according to room type
      IF rz.zone_code = 'HALL' THEN
        l := 16.00; w := 12.00; ded := 40.00;
      ELSIF rz.zone_code = 'MASTER_BEDROOM' THEN
        l := 14.00; w := 11.00; ded := 30.00;
      ELSIF rz.zone_code = 'CHILDREN_BEDROOM' THEN
        l := 12.00; w := 10.00; ded := 25.00;
      ELSIF rz.zone_code = 'GUEST_BEDROOM' THEN
        l := 12.00; w := 10.00; ded := 25.00;
      ELSIF rz.zone_code = 'KITCHEN' THEN
        l := 10.00; w := 8.50;  ded := 25.00;
      ELSIF rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET', 'TOILET_3') THEN
        l := 7.00;  w := 5.00;  ded := 15.00;
      ELSIF rz.zone_code IN ('DRY_BALCONY', 'BALCONY') THEN
        l := 8.00;  w := 4.50;  ded := 10.00;
      ELSE
        l := 10.00; w := 8.00;  ded := 20.00;
      END IF;

      INSERT INTO flat_room_dimensions (site_id, flat_id, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft)
      VALUES (1, f.id, rz.id, l, w, h, ded)
      ON CONFLICT (flat_id, room_zone_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 5. Seed realistic registered contractor contract unit rates
UPDATE contractors SET rate_per_sqft = 32.00, rate_per_unit = 32.00 WHERE trade_type = 'BRICK WORK';
UPDATE contractors SET rate_per_sqft = 18.00, rate_per_unit = 18.00 WHERE trade_type = 'PLASTER WORK';
UPDATE contractors SET rate_per_sqft = 22.00, rate_per_unit = 22.00 WHERE trade_type = 'POP';
UPDATE contractors SET rate_per_sqft = 38.00, rate_per_unit = 38.00 WHERE trade_type = 'TILES';
UPDATE contractors SET rate_per_sqft = 25.00, rate_per_unit = 25.00 WHERE trade_type = 'ELECTRICAL';
UPDATE contractors SET rate_per_sqft = 28.00, rate_per_unit = 28.00 WHERE trade_type = 'PLUMBING';
UPDATE contractors SET rate_per_sqft = 16.00, rate_per_unit = 16.00 WHERE trade_type = 'PAINTING';
UPDATE contractors SET rate_per_sqft = 45.00, rate_per_unit = 45.00 WHERE trade_type = 'CARPENTRY';
UPDATE contractors SET rate_per_sqft = 12.00, rate_per_unit = 12.00 WHERE trade_type = 'WATERPROOFING';
UPDATE contractors SET rate_per_sqft = 8.00,  rate_per_unit = 8.00  WHERE trade_type = 'CLEANING';
