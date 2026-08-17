-- ==============================================================================
-- CONSTRUCTTRACK MIGRATION 005: FLOOR PLAN & FLAT TYPOLOGY TEMPLATES
-- ==============================================================================

-- 1. Create typology_room_templates table
CREATE TABLE IF NOT EXISTS typology_room_templates (
  id BIGSERIAL PRIMARY KEY,
  site_id BIGINT DEFAULT 1 REFERENCES sites(id) ON DELETE CASCADE,
  flat_type VARCHAR(50) NOT NULL, -- '3BHK', '2BHK', '1BHK', '4BHK'
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

-- 2. Seed default room templates for 3BHK and 2BHK
INSERT INTO typology_room_templates (site_id, flat_type, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft)
SELECT 1, '3BHK', rz.id, 
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 16.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 14.00
    WHEN rz.zone_code = 'CHILDREN_BEDROOM' THEN 12.00
    WHEN rz.zone_code = 'GUEST_BEDROOM' THEN 12.00
    WHEN rz.zone_code = 'KITCHEN' THEN 10.00
    WHEN rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET', 'TOILET_3') THEN 7.00
    WHEN rz.zone_code IN ('DRY_BALCONY', 'BALCONY') THEN 8.00
    ELSE 10.00
  END,
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 12.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 11.00
    WHEN rz.zone_code = 'CHILDREN_BEDROOM' THEN 10.00
    WHEN rz.zone_code = 'GUEST_BEDROOM' THEN 10.00
    WHEN rz.zone_code = 'KITCHEN' THEN 8.50
    WHEN rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET', 'TOILET_3') THEN 5.00
    WHEN rz.zone_code IN ('DRY_BALCONY', 'BALCONY') THEN 4.50
    ELSE 8.00
  END,
  10.00,
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 40.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 30.00
    WHEN rz.zone_code = 'KITCHEN' THEN 25.00
    WHEN rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET', 'TOILET_3') THEN 15.00
    ELSE 20.00
  END
FROM room_zones rz
ON CONFLICT (site_id, flat_type, room_zone_id) DO NOTHING;

INSERT INTO typology_room_templates (site_id, flat_type, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft)
SELECT 1, '2BHK', rz.id, 
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 14.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 13.00
    WHEN rz.zone_code = 'CHILDREN_BEDROOM' THEN 11.00
    WHEN rz.zone_code = 'KITCHEN' THEN 9.00
    WHEN rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET') THEN 6.50
    WHEN rz.zone_code IN ('DRY_BALCONY', 'BALCONY') THEN 7.00
    ELSE 10.00
  END,
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 11.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 10.50
    WHEN rz.zone_code = 'CHILDREN_BEDROOM' THEN 9.50
    WHEN rz.zone_code = 'KITCHEN' THEN 7.50
    WHEN rz.zone_code IN ('WESTERN_TOILET', 'INDIAN_TOILET') THEN 4.50
    WHEN rz.zone_code IN ('DRY_BALCONY', 'BALCONY') THEN 4.00
    ELSE 8.00
  END,
  10.00,
  CASE 
    WHEN rz.zone_code = 'HALL' THEN 35.00
    WHEN rz.zone_code = 'MASTER_BEDROOM' THEN 25.00
    WHEN rz.zone_code = 'KITCHEN' THEN 20.00
    ELSE 15.00
  END
FROM room_zones rz
WHERE rz.zone_code NOT IN ('GUEST_BEDROOM', 'TOILET_3')
ON CONFLICT (site_id, flat_type, room_zone_id) DO NOTHING;
