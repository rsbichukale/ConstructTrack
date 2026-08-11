-- Clean up existing data
TRUNCATE sites, flats, room_zones, task_catalog, flat_tasks RESTART IDENTITY CASCADE;

-- Insert Sites
INSERT INTO sites (id, name) VALUES (1, 'Site 1'), (2, 'Site 2');

-- Seed Room Zones (9 Zones)
INSERT INTO room_zones (id, zone_code, zone_label) VALUES
(1, 'HALL', 'Hall'),
(2, 'MASTER_BEDROOM', 'Master Bedroom'),
(3, 'CHILDREN_BEDROOM', 'Children Bedroom'),
(4, 'KITCHEN', 'Kitchen'),
(5, 'WESTERN_TOILET', 'Western Toilet'),
(6, 'INDIAN_TOILET', 'Indian Toilet'),
(7, 'DRY_BALCONY', 'Dry Balcony'),
(8, 'BALCONY', 'Balcony'),
(9, 'COMMON_AREA', 'Common Area');

-- Seed Master Task Catalog (47 Micro-Tasks)
INSERT INTO task_catalog (trade_type, task_name, room_zone_id) VALUES
-- 1. Brickwork (9 Tasks)
('BRICK WORK', 'Hall Brickwork', 1), ('BRICK WORK', 'Master Bedroom Brickwork', 2),
('BRICK WORK', 'Children Bedroom Brickwork', 3), ('BRICK WORK', 'Western Toilet Brickwork', 5),
('BRICK WORK', 'Indian Toilet Brickwork', 6), ('BRICK WORK', 'Kitchen Brickwork', 4),
('BRICK WORK', 'Dry Balcony Brickwork', 7), ('BRICK WORK', 'Balcony Brickwork', 8),
('BRICK WORK', 'Common Area Brickwork', 9),

-- 2. Plaster Work (9 Tasks)
('PLASTER WORK', 'Hall Plaster', 1), ('PLASTER WORK', 'Master Bedroom Plaster', 2),
('PLASTER WORK', 'Children Bedroom Plaster', 3), ('PLASTER WORK', 'Western Toilet Plaster', 5),
('PLASTER WORK', 'Indian Toilet Plaster', 6), ('PLASTER WORK', 'Kitchen Plaster', 4),
('PLASTER WORK', 'Dry Balcony Plaster', 7), ('PLASTER WORK', 'Balcony Plaster', 8),
('PLASTER WORK', 'Common Area Plaster', 9),

-- 3. POP Work (9 Tasks)
('POP', 'Hall POP', 1), ('POP', 'Master Bedroom POP', 2),
('POP', 'Children Bedroom POP', 3), ('POP', 'Western Toilet POP', 5),
('POP', 'Indian Toilet POP', 6), ('POP', 'Kitchen POP', 4),
('POP', 'Dry Balcony POP', 7), ('POP', 'Balcony POP', 8),
('POP', 'Common Area POP', 9),

-- 4. Tiles & Granite (16 Tasks)
('TILES', 'Master Bedroom Window Granite', 2), ('TILES', 'Children Bedroom Window Granite', 3),
('TILES', 'Kitchen Door Granite', 4), ('TILES', 'Kitchen Window Granite', 4),
('TILES', 'Master Toilet Door Granite', 5), ('TILES', 'Common Toilet Door Granite', 6),
('TILES', 'Kitchen Bottom Granite', 4), ('TILES', 'Kitchen Top Granite', 4),
('TILES', 'Hall Flooring Tiles', 1), ('TILES', 'Kitchen Flooring Tiles', 4),
('TILES', 'Balcony Tiles', 8), ('TILES', 'Dry Balcony Tiles', 7),
('TILES', 'Master Bedroom Flooring Tiles', 2), ('TILES', 'Children Bedroom Flooring Tiles', 3),
('TILES', 'Master Bedroom Toilet Tiles', 5), ('TILES', 'Common Toilet Tiles', 6),

-- 5. Plumbing (4 Tasks)
('PLUMBER', 'Western Toilet Piping', 5), ('PLUMBER', 'Indian Toilet Piping', 6),
('PLUMBER', 'Kitchen Sink Piping', 4), ('PLUMBER', 'Balcony Piping', 8),

-- 6. Fabrication (2 Tasks)
('FABRICATION', 'Safety Grills', 1), ('FABRICATION', 'Balcony Railings', 8),

-- 7. Waterproofing (2 Tasks)
('WATERPROOFING', 'Toilet Brickbat Coba & Coating', 5), ('WATERPROOFING', 'Balcony Waterproofing', 8);

-- Seed 70 Flats (Wings B1 & B2, Floors 1 to 7)
DO $$
DECLARE
    w TEXT;
    flr INT;
    flt INT;
    flat_num TEXT;
BEGIN
    FOR w IN SELECT unnest(ARRAY['B1', 'B2']) LOOP
        FOR flr IN 1..7 LOOP
            FOR flt IN 1..5 LOOP
                flat_num := (flr * 100 + flt)::TEXT;
                INSERT INTO flats (site_id, wing, floor_number, flat_number)
                VALUES (1, w, flr, flat_num);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Bulk Generate 3,290 Flat Task Matrix Instances
INSERT INTO flat_tasks (flat_id, task_catalog_id, status, completion_pct)
SELECT f.id, tc.id, 'NOT_STARTED', 0
FROM flats f
CROSS JOIN task_catalog tc;