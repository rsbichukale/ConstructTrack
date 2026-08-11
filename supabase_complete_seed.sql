-- =========================================================================
-- CONSTRUCTTRACK CLEAN SUPABASE SQL SEEDING SCRIPT
-- Copy and paste this script into Supabase SQL Editor and click RUN
-- =========================================================================

-- 0. Dedicated Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    trade_code VARCHAR(50) UNIQUE NOT NULL,
    trade_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write trades" ON trades FOR ALL USING (true);

INSERT INTO trades (trade_code, trade_name) VALUES
('BRICK WORK', 'Brickwork & Masonry'),
('PLASTER WORK', 'Internal Cement Plastering'),
('POP', 'POP Wall Punning & Gypsum'),
('TILES', 'Tiles, Flooring & Granite'),
('PLUMBER', 'Concealed Plumbing & Drainage'),
('FABRICATION', 'Grills & Railing Fabrication'),
('WATERPROOFING', 'Wet Area Waterproofing'),
('ELECTRICAL', 'Electrical Conduit & Wiring'),
('PAINTING', 'Primer, Putty & Wall Painting'),
('CARPENTRY', 'Carpentry & Flush Doors'),
('FALSE CEILING', 'Gypsum Board False Ceiling'),
('DOOR FITTING', 'Door Frame Installation'),
('SANITARY', 'Sanitaryware & CP Fittings'),
('CLEANING', 'Deep Cleaning & Key Handover')
ON CONFLICT (trade_code) DO NOTHING;

-- 0b. Dedicated Wings & Floors Master Tables
CREATE TABLE IF NOT EXISTS wings (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    wing_code VARCHAR(20) UNIQUE NOT NULL,
    wing_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write wings" ON wings FOR ALL USING (true);

INSERT INTO wings (id, site_id, wing_code, wing_name) VALUES
(1, 1, 'B1', 'Wing B1'),
(2, 1, 'B2', 'Wing B2')
ON CONFLICT (wing_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    wing_code VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    floor_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, wing_code, floor_number)
);

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write floors" ON floors FOR ALL USING (true);

INSERT INTO floors (site_id, wing_code, floor_number, floor_label) VALUES
(1, 'B1', 1, '1st Floor'), (1, 'B1', 2, '2nd Floor'), (1, 'B1', 3, '3rd Floor'), (1, 'B1', 4, '4th Floor'), (1, 'B1', 5, '5th Floor'), (1, 'B1', 6, '6th Floor'), (1, 'B1', 7, '7th Floor'),
(1, 'B2', 1, '1st Floor'), (1, 'B2', 2, '2nd Floor'), (1, 'B2', 3, '3rd Floor'), (1, 'B2', 4, '4th Floor'), (1, 'B2', 5, '5th Floor'), (1, 'B2', 6, '6th Floor'), (1, 'B2', 7, '7th Floor')
ON CONFLICT (site_id, wing_code, floor_number) DO NOTHING;

-- 1. Truncate existing tables
TRUNCATE sites, flats, room_zones, contractors, laborers, task_catalog, flat_tasks, daily_progress_logs, contractor_attendance, department_attendance, daily_work_targets, snagging_items RESTART IDENTITY CASCADE;

-- 2. Seed Sites
INSERT INTO sites (id, name) VALUES 
(1, 'Site Alpha - Wings B1 & B2'),
(2, 'Tower Beta Development');

-- 3. Seed Room Zones (11 Zones)
INSERT INTO room_zones (id, zone_code, zone_label, icon_name) VALUES
(1,  'HALL',             'Hall',             'Building'),
(2,  'MASTER_BEDROOM',   'Master Bedroom',   'Building'),
(3,  'CHILDREN_BEDROOM', 'Children Bedroom', 'Building'),
(4,  'KITCHEN',          'Kitchen',          'Building'),
(5,  'WESTERN_TOILET',   'Western Toilet',   'Building'),
(6,  'INDIAN_TOILET',    'Indian Toilet',    'Building'),
(7,  'DRY_BALCONY',      'Dry Balcony',      'Building'),
(8,  'BALCONY',          'Balcony',          'Building'),
(9,  'COMMON_AREA',      'Common Area',      'Building'),
(10, 'GUEST_BEDROOM',    'Guest Bedroom',    'Building'),
(11, 'TOILET_3',         'Toilet 3',         'Building');

-- 4. Seed Contractors (14 Contractors)
INSERT INTO contractors (id, company_name, trade_type, contact_person, phone, rate_per_unit, email, status, wing_scope) VALUES
(1,  'Apex Masonry Works',             'BRICK WORK',    'Suresh Patil',   '+91 9822011223', 45.00,  'apex.masonry@constructtrack.com', 'ACTIVE', 'ALL'),
(2,  'Precision Plasterers',           'PLASTER WORK',  'Ramesh Shinde',  '+91 9822022334', 35.00,  'precision.plaster@constructtrack.com', 'ACTIVE', 'ALL'),
(3,  'GypsumPro POP Works',            'POP',           'Anil Kumar',     '+91 9822033445', 28.00,  'gypsum.pop@constructtrack.com', 'ACTIVE', 'ALL'),
(4,  'Royal Ceramic & Granite',        'TILES',         'Vikram Rathod',  '+91 9822044556', 65.00,  'royal.tiles@constructtrack.com', 'ACTIVE', 'ALL'),
(5,  'AquaFlow Plumbing Co.',          'PLUMBER',       'Dinesh Pawar',   '+91 9822055667', 120.00, 'aquaflow.plumb@constructtrack.com', 'ACTIVE', 'ALL'),
(6,  'MetalCraft Railings',            'FABRICATION',   'Santosh Jadhav', '+91 9822066778', 150.00, 'metalcraft@constructtrack.com', 'ACTIVE', 'ALL'),
(7,  'ShieldCoat Waterproofing',       'WATERPROOFING', 'Mahesh Kadam',   '+91 9822077889', 85.00,  'shieldcoat@constructtrack.com', 'ACTIVE', 'ALL'),
(8,  'BrightVolt Electricals',         'ELECTRICAL',    'Vijay Bhosale',  '+91 9822088990', 95.00,  'brightvolt@constructtrack.com', 'ACTIVE', 'ALL'),
(9,  'Canvas Finish Painters',         'PAINTING',      'Prakash More',   '+91 9822099001', 22.00,  'canvas.paint@constructtrack.com', 'ACTIVE', 'ALL'),
(10, 'CraftWood Joinery',              'CARPENTRY',     'Ganesh Deshmukh','+91 9822100112', 180.00, 'craftwood@constructtrack.com', 'ACTIVE', 'ALL'),
(11, 'Apex Ceiling Systems',           'FALSE CEILING', 'Sanjay Thorat',  '+91 9822111223', 75.00,  'apex.ceiling@constructtrack.com', 'ACTIVE', 'ALL'),
(12, 'DoorMaster Fittings',            'DOOR FITTING',  'Deepak Sawant',  '+91 9822122334', 110.00, 'doormaster@constructtrack.com', 'ACTIVE', 'ALL'),
(13, 'SanitaryPlus Solutions',         'SANITARY',      'Nitin Kale',     '+91 9822133445', 130.00, 'sanitaryplus@constructtrack.com', 'ACTIVE', 'ALL'),
(14, 'CleanHandover Services',         'CLEANING',      'Sachin Chavan',  '+91 9822144556', 15.00,  'cleanhandover@constructtrack.com', 'ACTIVE', 'ALL');

-- 5. Seed Laborers (10 Laborers)
INSERT INTO laborers (id, contractor_id, is_department_labor, name, skill_level, phone, id_number, daily_wage_rate) VALUES
(1,  1,  false, 'Rahul Shinde',    'Mason',      '+91 9870011111', 'AADHAAR-1001', 900.00),
(2,  1,  false, 'Sunil Pawar',     'Helper',     '+91 9870022222', 'AADHAAR-1002', 600.00),
(3,  2,  false, 'Amit Deshmukh',   'Mason',      '+91 9870033333', 'AADHAAR-1003', 950.00),
(4,  2,  false, 'Kiran Jadhav',    'Helper',     '+91 9870044444', 'AADHAAR-1004', 600.00),
(5,  3,  false, 'Vikas More',      'Technician', '+91 9870055555', 'AADHAAR-1005', 850.00),
(6,  4,  false, 'Sanjay Kadam',    'Tile Layer', '+91 9870066666', 'AADHAAR-1006', 950.00),
(7,  5,  false, 'Pravin Bhosale',  'Plumber',    '+91 9870077777', 'AADHAAR-1007', 900.00),
(8,  NULL, true, 'Manoj Chavan',   'In-House Helper', '+91 9870088888', 'AADHAAR-1008', 650.00),
(9,  NULL, true, 'Ganesh Thorat',  'In-House Helper', '+91 9870099999', 'AADHAAR-1009', 650.00),
(10, NULL, true, 'Dnyaneshwar Kale','In-House Helper', '+91 9870100000', 'AADHAAR-1010', 650.00);

-- 6. Seed Master Task Catalog (All 87 Micro-Tasks)
INSERT INTO task_catalog (id, trade_type, task_name, room_zone_id, execution_phase_id, is_building_common) VALUES
(1,  'BRICK WORK', 'Hall Red Brickwork & SC-200x200 Stub Column',       1,  1, false),
(2,  'BRICK WORK', 'Master Bedroom Red Brickwork & Stub Column',        2,  1, false),
(3,  'BRICK WORK', 'Children Bedroom Red Brickwork & Stub Column',     3,  1, false),
(4,  'BRICK WORK', 'Kitchen Red Brickwork',                            4,  1, false),
(5,  'BRICK WORK', 'Western Toilet Brickwork & Parapet Wall',           5,  1, false),
(6,  'BRICK WORK', 'Indian Toilet Brickwork & Parapet Wall',            6,  1, false),
(7,  'BRICK WORK', 'Dry Balcony Parapet Brickwork',                    7,  1, false),
(8,  'BRICK WORK', 'Balcony Parapet Brickwork & RCC Coping',           8,  1, false),
(9,  'BRICK WORK', 'Common Lobby & Duct Wall Brickwork',               9,  1, true),
(10, 'BRICK WORK', 'Guest Bedroom Red Brickwork',                      10, 1, false),
(11, 'BRICK WORK', 'Toilet 3 Partition Brickwork',                     11, 1, false),

(12, 'DOOR FITTING', 'Main Door Frame',                                1,  2, false),
(13, 'DOOR FITTING', 'Master Bedroom Door Frame',                      2,  2, false),
(14, 'DOOR FITTING', 'Children Bedroom Door Frame',                    3,  2, false),
(15, 'DOOR FITTING', 'Kitchen Door Frame',                             4,  2, false),
(16, 'DOOR FITTING', 'Western Toilet Granit Door Frame',               5,  2, false),
(17, 'DOOR FITTING', 'Indian Toilet Granite Door Frame',               6,  2, false),
(18, 'DOOR FITTING', 'Guest Bedroom Door Frame',                       10, 2, false),
(19, 'DOOR FITTING', 'Toilet 3 Granite Door Frame',                    11, 2, false),

(20, 'ELECTRICAL', 'Hall Chasing, Conduit & Switch Box',               1,  3, false),
(21, 'ELECTRICAL', 'Master Bedroom Conduit & DB Box',                  2,  3, false),
(22, 'ELECTRICAL', 'Children Bedroom Conduit & Point Box',             3,  3, false),
(23, 'ELECTRICAL', 'Kitchen Heavy Line Conduit (Fridge/Mixer/Oven)',   4,  3, false),
(24, 'ELECTRICAL', 'Western Toilet Geyser & Exhaust Conduit',          5,  3, false),
(25, 'ELECTRICAL', 'Indian Toilet Geyser Conduit',                     6,  3, false),
(26, 'ELECTRICAL', 'Balcony Light Point Conduit',                      8,  3, false),
(27, 'ELECTRICAL', 'Dry Balcony Washing Machine Point',                 7,  3, false),
(28, 'ELECTRICAL', 'Guest Bedroom Chasing & Switch Box',               10, 3, false),
(29, 'ELECTRICAL', 'Toilet 3 Geyser & Exhaust Conduit',                11, 3, false),

(30, 'PLUMBER', 'Kitchen Water Inlet & Drain Line (Sink & RO)',        4,  4, false),
(31, 'PLUMBER', 'Western Toilet Concealed Diverter & Flush Line',      5,  4, false),
(32, 'PLUMBER', 'Indian Toilet Flush Valve & Inlet Piping',            6,  4, false),
(33, 'PLUMBER', 'Dry Balcony Washing Machine Outlet & Tap Line',       7,  4, false),
(34, 'PLUMBER', 'Balcony Floor Drain Point',                           8,  4, false),
(35, 'PLUMBER', 'Toilet 3 Concealed Piping & Drain Line',              11, 4, false),

(36, 'PLASTER WORK', 'Hall Internal Smooth Cement Plaster',             1,  5, false),
(37, 'PLASTER WORK', 'Master Bedroom Cement Plaster',                  2,  5, false),
(38, 'PLASTER WORK', 'Children Bedroom Cement Plaster',                3,  5, false),
(39, 'PLASTER WORK', 'Kitchen Cement Plaster Coat',                    4,  5, false),
(40, 'PLASTER WORK', 'Western Toilet Rough Plaster (Tile Backup)',     5,  5, false),
(41, 'PLASTER WORK', 'Indian Toilet Rough Plaster',                    6,  5, false),
(42, 'PLASTER WORK', 'Dry Balcony Plaster',                            7,  5, false),
(43, 'PLASTER WORK', 'Balcony Ceiling & Wall Plaster',                 8,  5, false),
(44, 'PLASTER WORK', 'Common Lobby & Lift Wall Plaster',               9,  5, true),
(45, 'PLASTER WORK', 'Guest Bedroom Cement Plaster',                   10, 5, false),
(46, 'PLASTER WORK', 'Toilet 3 Rough Plaster',                         11, 5, false),

(47, 'WATERPROOFING', 'Western Toilet Brickbat Coba & Chemical Coat',  5,  6, false),
(48, 'WATERPROOFING', 'Indian Toilet Brickbat Coba & Coating',         6,  6, false),
(49, 'WATERPROOFING', 'Dry Balcony Chemical Waterproofing',            7,  6, false),
(50, 'WATERPROOFING', 'Balcony Waterproofing Coat',                    8,  6, false),
(51, 'WATERPROOFING', 'Toilet 3 Brickbat Coba & Coating',              11, 6, false),

(52, 'POP', 'Hall Wall POP Punning & Ceiling Gypsum',                  1,  7, false),
(53, 'POP', 'Master Bedroom POP Wall Punning',                         2,  7, false),
(54, 'POP', 'Children Bedroom POP Punning',                            3,  7, false),
(55, 'POP', 'Kitchen POP Ceiling Finish',                              4,  7, false),
(56, 'POP', 'Guest Bedroom POP Wall Punning',                          10, 7, false),

(57, 'FALSE CEILING', 'Hall Gypsum False Ceiling Framework',           1,  8, false),
(58, 'FALSE CEILING', 'Master Bedroom False Ceiling',                  2,  8, false),
(59, 'FALSE CEILING', 'Children Bedroom False Ceiling',                3,  8, false),
(60, 'FALSE CEILING', 'Guest Bedroom False Ceiling',                    10, 8, false),

(61, 'TILES', 'Hall Vitrified Flooring Tiles (800x800)',              1,  10, false),
(62, 'TILES', 'Master Bedroom Vitrified Flooring Tiles',               2,  10, false),
(63, 'TILES', 'Children Bedroom Flooring Tiles',                       3,  10, false),
(64, 'TILES', 'Kitchen Flooring Tiles & Granite Dado',                 4,  10, false),
(65, 'TILES', 'Kitchen L-Shape Granite Platform Fitting',              4,  9,  false),
(66, 'TILES', 'Western Toilet Full Height Wall Dado Tiles',            5,  10, false),
(67, 'TILES', 'Western Toilet Anti-Skid Floor Tiles',                  5,  10, false),
(68, 'TILES', 'Indian Toilet Wall Dado Tiles',                         6,  10, false),
(69, 'TILES', 'Indian Toilet Anti-Skid Floor Tiles',                   6,  10, false),
(70, 'TILES', 'Dry Balcony Flooring Tiles',                            7,  10, false),
(71, 'TILES', 'Balcony Anti-Skid Flooring Tiles',                      8,  10, false),
(72, 'TILES', 'Hall Window Granite Sill Fitting',                      1,  9,  false),
(73, 'TILES', 'Master Bedroom Window Granite Sill',                    2,  9,  false),
(74, 'TILES', 'Children Bedroom Window Granite Sill',                  3,  9,  false),
(75, 'TILES', 'Guest Bedroom Flooring Tiles',                          10, 10, false),
(76, 'TILES', 'Toilet 3 Full Height Dado Tiles',                       11, 10, false),

(77, 'PAINTING', 'Hall Primer & 2-Coat Acrylic Emulsion',              1,  11, false),
(78, 'PAINTING', 'Master Bedroom Primer & Paint',                      2,  11, false),
(79, 'PAINTING', 'Children Bedroom Primer & Paint',                    3,  11, false),
(80, 'PAINTING', 'Kitchen Oil Bound Distemper / Emulsion',             4,  11, false),
(81, 'PAINTING', 'Guest Bedroom Primer & Paint',                       10, 11, false),

(82, 'CARPENTRY', 'Main Door Shutter & Flush Door Fitting',            1,  12, false),
(83, 'CARPENTRY', 'Master Bedroom Flush Door Fitting',                 2,  12, false),
(84, 'FABRICATION', 'Hall Safety Grill & Balcony Railing',             8,  13, false),
(85, 'SANITARY', 'Western Toilet Commode, Basin & CP Fittings',        5,  14, false),
(86, 'SANITARY', 'Indian Toilet Pan, Pillar Cock & Taps',              6,  14, false),
(87, 'CLEANING', 'Flat Final Deep Cleaning & Handover Key Polish',     9,  14, false);

-- 7. Seed 70 Flats (Wings B1 & B2, Floors 1 to 7)
INSERT INTO flats (site_id, wing, floor_number, flat_number, flat_type) VALUES
-- Wing B1 (35 Flats)
(1, 'B1', 1, '101', '3BHK'), (1, 'B1', 1, '102', '3BHK'), (1, 'B1', 1, '103', '2BHK'), (1, 'B1', 1, '104', '2BHK'), (1, 'B1', 1, '105', '2BHK'),
(1, 'B1', 2, '201', '3BHK'), (1, 'B1', 2, '202', '3BHK'), (1, 'B1', 2, '203', '2BHK'), (1, 'B1', 2, '204', '2BHK'), (1, 'B1', 2, '205', '2BHK'),
(1, 'B1', 3, '301', '3BHK'), (1, 'B1', 3, '302', '3BHK'), (1, 'B1', 3, '303', '2BHK'), (1, 'B1', 3, '304', '2BHK'), (1, 'B1', 3, '305', '2BHK'),
(1, 'B1', 4, '401', '3BHK'), (1, 'B1', 4, '402', '3BHK'), (1, 'B1', 4, '403', '2BHK'), (1, 'B1', 4, '404', '2BHK'), (1, 'B1', 4, '405', '2BHK'),
(1, 'B1', 5, '501', '3BHK'), (1, 'B1', 5, '502', '3BHK'), (1, 'B1', 5, '503', '2BHK'), (1, 'B1', 5, '504', '2BHK'), (1, 'B1', 5, '505', '2BHK'),
(1, 'B1', 6, '601', '3BHK'), (1, 'B1', 6, '602', '3BHK'), (1, 'B1', 6, '603', '2BHK'), (1, 'B1', 6, '604', '2BHK'), (1, 'B1', 6, '605', '2BHK'),
(1, 'B1', 7, '701', '3BHK'), (1, 'B1', 7, '702', '3BHK'), (1, 'B1', 7, '703', '2BHK'), (1, 'B1', 7, '704', '2BHK'), (1, 'B1', 7, '705', '2BHK'),
-- Wing B2 (35 Flats)
(1, 'B2', 1, '101', '3BHK'), (1, 'B2', 1, '102', '3BHK'), (1, 'B2', 1, '103', '2BHK'), (1, 'B2', 1, '104', '2BHK'), (1, 'B2', 1, '105', '2BHK'),
(1, 'B2', 2, '201', '3BHK'), (1, 'B2', 2, '202', '3BHK'), (1, 'B2', 2, '203', '2BHK'), (1, 'B2', 2, '204', '2BHK'), (1, 'B2', 2, '205', '2BHK'),
(1, 'B2', 3, '301', '3BHK'), (1, 'B2', 3, '302', '3BHK'), (1, 'B2', 3, '303', '2BHK'), (1, 'B2', 3, '304', '2BHK'), (1, 'B2', 3, '305', '2BHK'),
(1, 'B2', 4, '401', '3BHK'), (1, 'B2', 4, '402', '3BHK'), (1, 'B2', 4, '403', '2BHK'), (1, 'B2', 4, '404', '2BHK'), (1, 'B2', 4, '405', '2BHK'),
(1, 'B2', 5, '501', '3BHK'), (1, 'B2', 5, '502', '3BHK'), (1, 'B2', 5, '503', '2BHK'), (1, 'B2', 5, '504', '2BHK'), (1, 'B2', 5, '505', '2BHK'),
(1, 'B2', 6, '601', '3BHK'), (1, 'B2', 6, '602', '3BHK'), (1, 'B2', 6, '603', '2BHK'), (1, 'B2', 6, '604', '2BHK'), (1, 'B2', 6, '605', '2BHK'),
(1, 'B2', 7, '701', '3BHK'), (1, 'B2', 7, '702', '3BHK'), (1, 'B2', 7, '703', '2BHK'), (1, 'B2', 7, '704', '2BHK'), (1, 'B2', 7, '705', '2BHK');

-- 8. Bulk Generate 3,290 Flat Task Matrix Entries
INSERT INTO flat_tasks (flat_id, task_catalog_id, assigned_contractor_id, status, completion_pct)
SELECT 
    f.id AS flat_id, 
    tc.id AS task_catalog_id,
    CASE 
        WHEN tc.trade_type = 'BRICK WORK' THEN 1
        WHEN tc.trade_type = 'PLASTER WORK' THEN 2
        WHEN tc.trade_type = 'POP' THEN 3
        WHEN tc.trade_type = 'TILES' THEN 4
        WHEN tc.trade_type = 'PLUMBER' THEN 5
        WHEN tc.trade_type = 'FABRICATION' THEN 6
        WHEN tc.trade_type = 'WATERPROOFING' THEN 7
        WHEN tc.trade_type = 'ELECTRICAL' THEN 8
        WHEN tc.trade_type = 'PAINTING' THEN 9
        WHEN tc.trade_type = 'CARPENTRY' THEN 10
        WHEN tc.trade_type = 'FALSE CEILING' THEN 11
        WHEN tc.trade_type = 'DOOR FITTING' THEN 12
        WHEN tc.trade_type = 'SANITARY' THEN 13
        WHEN tc.trade_type = 'CLEANING' THEN 14
        ELSE 1
    END AS assigned_contractor_id,
    'NOT_STARTED' AS status,
    0 AS completion_pct
FROM flats f
CROSS JOIN task_catalog tc;
