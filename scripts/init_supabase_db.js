const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Rutuja%40987%23@db.iwjowtdhfgjccjzxmdyl.supabase.co:5432/postgres';

async function initSupabaseDatabase() {
  console.log('🔌 Connecting directly to Supabase PostgreSQL cloud database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL!');

    // 1. Read and execute supabase_schema.sql
    const schemaSqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');

    console.log('📜 Executing table schema DDL (13 tables, RLS policies, indexes)...');
    await client.query(schemaSql);
    console.log('✅ Tables created successfully in Supabase PostgreSQL!');

    // 2. Seed Sites
    console.log('🌱 Seeding Sites...');
    await client.query(`
      INSERT INTO sites (id, name)
      VALUES (1, 'Apex Horizon High-Rise Project')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Seed Room Zones
    console.log('🌱 Seeding Room Zones...');
    const roomZones = [
      [1, 'HALL', 'Hall', 'Sofa'],
      [2, 'MASTER_BEDROOM', 'Master Bedroom', 'BedDouble'],
      [3, 'CHILDREN_BEDROOM', 'Children Bedroom', 'Bed'],
      [4, 'KITCHEN', 'Kitchen', 'Utensils'],
      [5, 'WESTERN_TOILET', 'Western Toilet (Master)', 'Bath'],
      [6, 'INDIAN_TOILET', 'Indian Toilet (Common)', 'Droplets'],
      [7, 'DRY_BALCONY', 'Dry Balcony', 'Wind'],
      [8, 'BALCONY', 'Balcony', 'Sun'],
      [9, 'COMMON_AREA', 'Common Area', 'Building'],
      [10, 'GUEST_BEDROOM', 'Guest Bedroom (Bed 3)', 'BedSingle'],
      [11, 'TOILET_3', 'Attached Toilet 3 (3BHK)', 'Bath'],
    ];

    for (const [id, code, label, icon] of roomZones) {
      await client.query(
        `INSERT INTO room_zones (id, zone_code, zone_label, icon_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET zone_label = EXCLUDED.zone_label, icon_name = EXCLUDED.icon_name;`,
        [id, code, label, icon]
      );
    }

    // 4. Seed Contractors
    console.log('🌱 Seeding Contractors...');
    const contractors = [
      [1, 'Apex Masonry Works', ['BRICK WORK'], 'Ramesh Patel', '+91 9876543210', 0, 'apex@masonry.com', 'B1'],
      [2, 'BuildPro Plastering Co.', ['PLASTER WORK'], 'Suresh Kumar', '+91 9876543211', 0, 'buildpro@plaster.com', 'B1'],
      [3, 'Royal POP Designers', ['POP'], 'Vijay Sharma', '+91 9876543212', 0, 'royal@pop.com', 'ALL'],
      [4, 'Granite & Tile Masters', ['TILES'], 'Anil Gupta', '+91 9876543213', 0, 'granite@tiles.com', 'ALL'],
      [5, 'FlowTech Plumbing Solutions', ['PLUMBER'], 'Prakash Rao', '+91 9876543214', 0, 'flowtech@plumber.com', 'B2'],
      [6, 'ShieldProof Waterproofers', ['WATERPROOFING'], 'Sunil Mehta', '+91 9876543215', 0, 'shield@waterproof.com', 'ALL'],
      [7, 'SteelGrid Fabricators', ['FABRICATION'], 'Dinesh Carpenter', '+91 9876543216', 0, 'steelgrid@fab.com', 'ALL'],
      [8, 'PowerLine Electrical Works', ['ELECTRICAL'], 'Ashok Electricwala', '+91 9876543217', 0, 'powerline@elec.com', 'ALL'],
      [9, 'ColorKraft Painters', ['PAINTING'], 'Rakesh Painter', '+91 9876543218', 0, 'colorkraft@paint.com', 'ALL'],
      [10, 'WoodCraft Interiors', ['CARPENTRY'], 'Mohan Carpenter', '+91 9876543219', 0, 'woodcraft@carp.com', 'ALL'],
      [11, 'CeilPro False Ceiling', ['FALSE CEILING'], 'Ganesh Ceiling', '+91 9876543220', 0, 'ceilpro@fc.com', 'ALL'],
      [12, 'DoorMaster Fittings', ['DOOR FITTING'], 'Kamlesh Door', '+91 9876543221', 0, 'doormaster@fit.com', 'ALL'],
      [13, 'SaniFlow CP Fittings', ['SANITARY'], 'Bharat Sanitary', '+91 9876543222', 0, 'saniflow@cp.com', 'ALL'],
      [14, 'CleanSite Services', ['CLEANING'], 'Suman Clean', '+91 9876543223', 0, 'cleansite@srv.com', 'ALL'],
    ];

    for (const [id, comp, trades, person, phone, rate, email, scope] of contractors) {
      await client.query(
        `INSERT INTO contractors (id, company_name, contact_person, phone, rate_per_unit, email, wing_scope)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name, phone = EXCLUDED.phone;`,
        [id, comp, person, phone, rate, email, scope]
      );

      for (const trade of trades) {
        await client.query(
         `INSERT INTO contractor_trades (contractor_id, trade_type)
          VALUES ($1, $2)
          ON CONFLICT (contractor_id, trade_type) DO NOTHING;`,
         [id, trade]
        );
      }
    }

    // 5. Seed Laborers
    console.log('🌱 Seeding Laborers & Department Helpers...');
    const laborers = [
      [1, 1, false, 'Ram Singh', 'LEAD', '+91 9811122233', 'AD-8849-1029', 850],
      [2, 1, false, 'Shyam Yadav', 'MASON', '+91 9811122234', 'AD-8849-1030', 750],
      [3, 1, false, 'Vikram Kumar', 'HELPER', '+91 9811122235', 'AD-8849-1031', 500],
      [4, 2, false, 'Manoj Verma', 'MASON', '+91 9822233344', 'AD-7738-9920', 750],
      [5, 2, false, 'Sanjay Paswan', 'HELPER', '+91 9822233345', 'AD-7738-9921', 500],
      [6, 4, false, 'Deepak Tilemaster', 'LEAD', '+91 9833344455', 'AD-6627-8812', 900],
      [7, 5, false, 'Rajesh Plumber', 'MASON', '+91 9844455566', 'AD-5516-7703', 800],
      [8, null, true, 'Suresh (Department Helper 1)', 'HELPER', '+91 9899900011', 'DEP-101', 600],
      [9, null, true, 'Ramesh (Department Helper 2)', 'HELPER', '+91 9899900012', 'DEP-102', 600],
      [10, null, true, 'Ganesh (Site Mukadam)', 'LEAD', '+91 9899900013', 'DEP-103', 900],
    ];

    for (const [id, cId, isDept, name, skill, phone, idNum, wage] of laborers) {
      await client.query(
        `INSERT INTO laborers (id, contractor_id, is_department_labor, name, skill_level, phone, id_number, daily_wage_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, daily_wage_rate = EXCLUDED.daily_wage_rate;`,
        [id, cId, isDept, name, skill, phone, idNum, wage]
      );
    }

    // 6. Seed 70 Flats (Wings B1 & B2, 3BHK / 2BHK Mix)
    console.log('🌱 Seeding 70 Flats (Wing B1 & B2, 3BHK & 2BHK)...');
    let flatIdCounter = 1;
    for (const wing of ['B1', 'B2']) {
      for (let floor = 1; floor <= 7; floor++) {
        for (let flatNum = 1; flatNum <= 5; flatNum++) {
          const flatNumber = `${floor}0${flatNum}`;
          const flatType = flatNum <= 2 ? '3BHK' : '2BHK';
          await client.query(
            `INSERT INTO flats (id, site_id, wing, floor_number, flat_number, flat_type)
             VALUES ($1, 1, $2, $3, $4, $5)
             ON CONFLICT (site_id, wing, flat_number) DO UPDATE SET flat_type = EXCLUDED.flat_type;`,
            [flatIdCounter++, wing, floor, flatNumber, flatType]
          );
        }
      }
    }

    // Reset sequence counters for clean IDs
    await client.query(`SELECT setval('flats_id_seq', (SELECT MAX(id) FROM flats));`);
    await client.query(`SELECT setval('contractors_id_seq', (SELECT MAX(id) FROM contractors));`);
    await client.query(`SELECT setval('laborers_id_seq', (SELECT MAX(id) FROM laborers));`);

    console.log('🎉 SUPABASE POSTGRESQL DATABASE SEEDED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Supabase DB Initialization Error:', err);
  } finally {
    await client.end();
  }
}

initSupabaseDatabase();
