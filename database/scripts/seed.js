/**
 * Consolidated Master Project Dataset Seeder
 * Seeds Sites, Wings B1/B2, Floors 1-7, 70 Flats, 10 Phases, 6,832 Micro-Tasks,
 * Materials, Machinery Fleet, Concrete QA Tests, Safety Briefings, and App Users.
 */

const path = require('path');
let Client;
try {
  Client = require('pg').Client;
} catch (_) {
  Client = require(path.join(__dirname, '../../backend/node_modules/pg')).Client;
}
let dotenv;
try {
  dotenv = require('dotenv');
} catch (_) {
  dotenv = require(path.join(__dirname, '../../backend/node_modules/dotenv'));
}

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Rutuja%40987@localhost:5432/constructtrack_db';

async function seedMasterProject() {
  console.log('================================================================');
  console.log('🌱 CONSTRUCTTRACK MASTER DATASET SEEDER (Local PostgreSQL)');
  console.log('================================================================');

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to PostgreSQL...');

  // 1. Sites
  console.log('1. Sites...');
  await client.query(`
    INSERT INTO sites (id, name)
    VALUES (1, 'Apex Horizon High-Rise Project')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  `);

  // 2. Wings
  console.log('2. Wings...');
  await client.query(`
    INSERT INTO wings (id, site_id, wing_code, wing_name)
    VALUES 
      (1, 1, 'B1', 'Wing B1 (East Tower)'),
      (2, 1, 'B2', 'Wing B2 (West Tower)')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. Floors
  console.log('3. Floors...');
  let floorId = 1;
  for (const wingObj of [{ id: 1, code: 'B1' }, { id: 2, code: 'B2' }]) {
    for (let f = 1; f <= 7; f++) {
      await client.query(`
        INSERT INTO floors (id, wing_id, floor_number, wing)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `, [floorId++, wingObj.id, f, wingObj.code]);
    }
  }

  // 4. Room Zones
  console.log('4. Room Zones...');
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
    [11, 'TOILET_3', 'Attached Toilet 3 (3BHK)', 'Bath']
  ];

  for (const [id, code, label, icon] of roomZones) {
    await client.query(`
      INSERT INTO room_zones (id, zone_code, zone_label, icon_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET zone_label = EXCLUDED.zone_label, icon_name = EXCLUDED.icon_name;
    `, [id, code, label, icon]);
  }

  // 5. Trades
  console.log('5. Trades...');
  const trades = [
    ['BRICK WORK', 'Brick & AAC Block Masonry'],
    ['PLASTER WORK', 'Internal & External Plaster'],
    ['POP', 'POP Punning & Gypsum Finish'],
    ['TILES', 'Vitrified & Ceramic Tiling'],
    ['PLUMBER', 'Plumbing Lines & Drainage'],
    ['WATERPROOFING', 'Brickbat Coba & Chemical Waterproofing'],
    ['ELECTRICAL', 'Concealed Conduits & Wiring'],
    ['PAINTING', 'Primer & Emulsion Painting'],
    ['FABRICATION', 'MS Railings & Safety Grills'],
    ['CARPENTRY', 'Door Frames & Wooden Paneling'],
    ['FALSE CEILING', 'Gypsum False Ceiling Grid'],
    ['DOOR FITTING', 'Flush Doors & Lock Hardware'],
    ['SANITARY', 'CP Fittings & Sanitary Ware'],
    ['CLEANING', 'Deep Cleaning & Final Acid Wash']
  ];

  for (const [code, name] of trades) {
    await client.query(`
      INSERT INTO trades (trade_code, trade_name)
      VALUES ($1, $2)
      ON CONFLICT (trade_code) DO UPDATE SET trade_name = EXCLUDED.trade_name;
    `, [code, name]);
  }

  // 6. Contractors
  console.log('6. Contractors...');
  const contractors = [
    [1, 'Apex Masonry Works', 'BRICK WORK', 'Ramesh Patel', '+91 9876543210', 45, 'apex@masonry.com', 'B1'],
    [2, 'BuildPro Plastering Co.', 'PLASTER WORK', 'Suresh Kumar', '+91 9876543211', 35, 'buildpro@plaster.com', 'B1'],
    [3, 'Royal POP Designers', 'POP', 'Vijay Sharma', '+91 9876543212', 28, 'royal@pop.com', 'ALL'],
    [4, 'Granite & Tile Masters', 'TILES', 'Anil Gupta', '+91 9876543213', 60, 'granite@tiles.com', 'ALL'],
    [5, 'FlowTech Plumbing Solutions', 'PLUMBER', 'Prakash Rao', '+91 9876543214', 50, 'flowtech@plumber.com', 'B2'],
    [6, 'ShieldProof Waterproofers', 'WATERPROOFING', 'Sunil Mehta', '+91 9876543215', 55, 'shield@waterproof.com', 'ALL'],
    [7, 'SteelGrid Fabricators', 'FABRICATION', 'Dinesh Carpenter', '+91 9876543216', 70, 'steelgrid@fab.com', 'ALL'],
    [8, 'PowerLine Electrical Works', 'ELECTRICAL', 'Ashok Electricwala', '+91 9876543217', 48, 'powerline@elec.com', 'ALL'],
    [9, 'ColorKraft Painters', 'PAINTING', 'Rakesh Painter', '+91 9876543218', 32, 'colorkraft@paint.com', 'ALL'],
    [10, 'WoodCraft Interiors', 'CARPENTRY', 'Mohan Carpenter', '+91 9876543219', 65, 'woodcraft@carp.com', 'ALL'],
    [11, 'CeilPro False Ceiling', 'FALSE CEILING', 'Ganesh Ceiling', '+91 9876543220', 42, 'ceilpro@fc.com', 'ALL'],
    [12, 'DoorMaster Fittings', 'DOOR FITTING', 'Kamlesh Door', '+91 9876543221', 50, 'doormaster@fit.com', 'ALL'],
    [13, 'SaniFlow CP Fittings', 'SANITARY', 'Bharat Sanitary', '+91 9876543222', 45, 'saniflow@cp.com', 'ALL'],
    [14, 'CleanSite Services', 'CLEANING', 'Suman Clean', '+91 9876543223', 20, 'cleansite@srv.com', 'ALL']
  ];

  for (const [id, comp, trade, person, phone, rate, email, scope] of contractors) {
    await client.query(`
      INSERT INTO contractors (id, company_name, trade_type, contact_person, phone, rate_per_unit, email, wing_scope)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name, phone = EXCLUDED.phone;
    `, [id, comp, trade, person, phone, rate, email, scope]);
  }

  // 7. Execution Phases
  console.log('7. Execution Phases...');
  const phases = [
    [1, 1, 'Phase 1: Civil & Blockwork', 'BRICK WORK', 3],
    [2, 2, 'Phase 2: Plaster & POP Base', 'PLASTER WORK', 3],
    [3, 3, 'Phase 3: Waterproofing & Wet Areas', 'WATERPROOFING', 3],
    [4, 4, 'Phase 4: Concealed Conduiting & Piping', 'PLUMBER', 2],
    [5, 5, 'Phase 5: Flooring & Wall Tiling', 'TILES', 4],
    [6, 6, 'Phase 6: False Ceiling & POP Finish', 'POP', 2],
    [7, 7, 'Phase 7: Electrical Wiring & Switch Plates', 'ELECTRICAL', 2],
    [8, 8, 'Phase 8: Doors, Windows & Carpentry', 'CARPENTRY', 2],
    [9, 9, 'Phase 9: Final Painting & Touch-up', 'PAINTING', 3],
    [10, 10, 'Phase 10: Sanitary Fixtures & Handover Clean', 'CLEANING', 2]
  ];

  for (const [id, pNum, name, trade, est] of phases) {
    await client.query(`
      INSERT INTO execution_phases (id, phase_number, phase_name, trade_type, estimated_days)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET phase_name = EXCLUDED.phase_name;
    `, [id, pNum, name, trade, est]);
  }

  // 8. Flat Typologies
  console.log('8. Flat Typologies...');
  const typologies = [
    ['1BHK', [1, 2, 4, 5, 6, 7]],
    ['2BHK', [1, 2, 3, 4, 5, 6, 7, 8]],
    ['3BHK', [1, 2, 3, 4, 5, 6, 7, 8, 10, 11]],
    ['4BHK', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]
  ];

  for (const [typ, zones] of typologies) {
    for (const zId of zones) {
      await client.query(`
        INSERT INTO flat_typology_room_zones (flat_type, room_zone_id)
        VALUES ($1, $2)
        ON CONFLICT (flat_type, room_zone_id) DO NOTHING;
      `, [typ, zId]);
    }
  }

  // 9. Task Catalog (110 standard room tasks)
  console.log('9. Task Catalog...');
  let catalogId = 1;
  const standardRoomTasks = [
    { trade: 'BRICK WORK', name: 'Line Dori & AAC Block Work', days: 2, phase: 1 },
    { trade: 'PLASTER WORK', name: 'Internal Single Coat Plaster', days: 2, phase: 2 },
    { trade: 'POP', name: 'Gypsum POP Punning', days: 1, phase: 2 },
    { trade: 'ELECTRICAL', name: 'Concealed Conduit Chipping & Box Fixing', days: 1, phase: 4 },
    { trade: 'TILES', name: 'Flooring & Skirting Tiling', days: 2, phase: 5 },
    { trade: 'FALSE CEILING', name: 'False Ceiling Perimeter & Gypsum Board', days: 1, phase: 6 },
    { trade: 'ELECTRICAL', name: 'Wiring Pull & Switch Board Dressing', days: 1, phase: 7 },
    { trade: 'CARPENTRY', name: 'Door Frame & Shutter Fixing', days: 1, phase: 8 },
    { trade: 'PAINTING', name: 'Primer Coat & Two Coats Acrylic Emulsion', days: 2, phase: 9 },
    { trade: 'CLEANING', name: 'Pre-Handover Deep Scrub & Cleaning', days: 1, phase: 10 }
  ];

  const toiletTasks = [
    { trade: 'WATERPROOFING', name: 'Brickbat Coba Base Waterproofing', days: 2, phase: 3 },
    { trade: 'PLUMBER', name: 'Concealed CPVC & Drainage Pipe Concealment', days: 2, phase: 4 },
    { trade: 'WATERPROOFING', name: 'Chemical Membrane & Pond Testing (48hrs)', days: 2, phase: 3 },
    { trade: 'TILES', name: 'Dado Wall Tiling up to Lintel Level', days: 2, phase: 5 },
    { trade: 'TILES', name: 'Anti-Skid Floor Tiling & Grouting', days: 1, phase: 5 },
    { trade: 'SANITARY', name: 'CP Fittings, Diverter, Basin & WC Fixing', days: 1, phase: 10 }
  ];

  for (const [zId, zCode, zLabel] of roomZones) {
    const isToilet = zCode.includes('TOILET');
    const taskSet = isToilet ? [...standardRoomTasks.filter(t => t.trade !== 'TILES' && t.trade !== 'PAINTING'), ...toiletTasks] : standardRoomTasks;

    for (const t of taskSet) {
      await client.query(`
        INSERT INTO task_catalog (id, task_name, trade_type, room_zone_id, most_likely_days, execution_phase_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET task_name = EXCLUDED.task_name;
      `, [catalogId++, `${zLabel} ${t.name}`, t.trade, zId, t.days, t.phase]);
    }
  }

  // 10. 70 Residential Flats
  console.log('10. 70 Residential Flats...');
  let flatIdCounter = 1;
  const flatRecords = [];
  for (const wing of ['B1', 'B2']) {
    for (let floor = 1; floor <= 7; floor++) {
      for (let flatNum = 1; flatNum <= 5; flatNum++) {
        const fNumber = `${floor}0${flatNum}`;
        const fType = flatNum <= 2 ? '3BHK' : '2BHK';
        await client.query(`
          INSERT INTO flats (id, site_id, wing, floor_number, flat_number, flat_type)
          VALUES ($1, 1, $2, $3, $4, $5)
          ON CONFLICT (site_id, wing, flat_number) DO UPDATE SET flat_type = EXCLUDED.flat_type;
        `, [flatIdCounter, wing, floor, fNumber, fType]);
        flatRecords.push({ id: flatIdCounter, wing, floor, fNumber, fType });
        flatIdCounter++;
      }
    }
  }

  // 11. Micro-Tasks in flat_tasks
  console.log('11. Micro-Tasks...');
  const catRes = await client.query('SELECT * FROM task_catalog');
  const catTasks = catRes.rows;

  const typRes = await client.query('SELECT * FROM flat_typology_room_zones');
  const typMap = {};
  for (const r of typRes.rows) {
    if (!typMap[r.flat_type]) typMap[r.flat_type] = new Set();
    typMap[r.flat_type].add(Number(r.room_zone_id));
  }

  let flatTaskId = 1;
  const flatTaskValues = [];

  for (const f of flatRecords) {
    const allowedZones = typMap[f.fType] || new Set();
    const flatApplicableTasks = catTasks.filter(t => allowedZones.has(Number(t.room_zone_id)));

    for (const t of flatApplicableTasks) {
      const cMatch = contractors.find(c => c[2] === t.trade_type);
      const contractorId = cMatch ? cMatch[0] : 1;

      let status = 'NOT_STARTED';
      let pct = 0;
      if (f.floor <= 2) {
        status = 'APPROVED';
        pct = 100;
      } else if (f.floor <= 4) {
        status = t.execution_phase_id <= 4 ? 'APPROVED' : (t.execution_phase_id <= 6 ? 'IN_PROGRESS' : 'NOT_STARTED');
        pct = status === 'APPROVED' ? 100 : (status === 'IN_PROGRESS' ? 60 : 0);
      } else if (f.floor <= 5) {
        status = t.execution_phase_id <= 2 ? 'APPROVED' : (t.execution_phase_id <= 4 ? 'IN_PROGRESS' : 'NOT_STARTED');
        pct = status === 'APPROVED' ? 100 : (status === 'IN_PROGRESS' ? 40 : 0);
      }

      flatTaskValues.push(`(${flatTaskId++}, ${f.id}, ${t.id}, ${contractorId}, '${status}', ${pct})`);
    }
  }

  console.log(`Inserting ${flatTaskValues.length} micro-tasks...`);
  const CHUNK = 500;
  for (let i = 0; i < flatTaskValues.length; i += CHUNK) {
    const slice = flatTaskValues.slice(i, i + CHUNK).join(',');
    await client.query(`
      INSERT INTO flat_tasks (id, flat_id, task_catalog_id, assigned_contractor_id, status, completion_pct)
      VALUES ${slice}
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // 12. Materials
  console.log('12. Materials...');
  const materials = [
    [1, 'UltraTech Cement (50kg Bag)', 'Cement & Binders', 450, 'BAGS', 100, 300, 400],
    [2, 'Fe550D TMT Rebar (12mm)', 'Steel & Rebars', 8.5, 'TONS', 2.0, 5.0, 62000],
    [3, 'Crushed River Sand', 'Aggregates', 42, 'BRASS', 10, 20, 6500],
    [4, 'Vitrified Double Charge Tiles (600x600)', 'Finishing & Tiles', 650, 'BOXES', 150, 300, 850],
    [5, 'Tile Adhesive (20kg Bag)', 'Chemicals & Adhesives', 80, 'BAGS', 50, 100, 520],
    [6, 'CPVC Pipes (1 inch - 3m)', 'Plumbing', 120, 'PIECES', 30, 50, 340]
  ];

  for (const [id, name, cat, stock, unit, min, reorder, rate] of materials) {
    await client.query(`
      INSERT INTO material_inventory (id, item_name, category, current_stock, unit, min_reorder_level, reorder_quantity, avg_rate_per_unit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    `, [id, name, cat, stock, unit, min, reorder, rate]);
  }

  // 13. Concrete Tests
  console.log('13. Concrete Tests...');
  const tests = [
    [1, 'Column C1-C8', 'B1', 1, 'M30', 'UltraTech RMC Plant', 125, '2026-08-01', 7, '2026-08-08', 20.0, 23.5, 'PASSED'],
    [2, 'Column C1-C8', 'B1', 1, 'M30', 'UltraTech RMC Plant', 125, '2026-08-01', 28, '2026-08-29', 30.0, 35.8, 'PASSED'],
    [3, 'Floor Slab S1-S5', 'B1', 2, 'M25', 'ACC Concrete Hub', 120, '2026-08-05', 7, '2026-08-12', 16.5, 19.2, 'PASSED']
  ];

  for (const [id, mem, w, fl, gr, sup, slump, cDate, age, tDate, tgt, act, stat] of tests) {
    await client.query(`
      INSERT INTO concrete_cube_tests (id, structural_member, wing, floor_number, concrete_grade, supplier_r_m_c, slump_mm, casting_date, test_age_days, test_date, target_strength_mpa, actual_strength_mpa, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING;
    `, [id, mem, w, fl, gr, sup, slump, cDate, age, tDate, tgt, act, stat]);
  }

  // 14. Machinery
  console.log('14. Machinery...');
  const mach = [
    [1, 'Tower Crane TC-01', 'Crane', 'TC-MH-04-9821', 'Ramesh Yadav', 1420.5, 1428.5, 8.0, 45.0, 'Tower B1 Slab Shuttering Lift', 'Wing B1', '2026-08-16'],
    [2, 'Concrete Boom Pump BP-02', 'Pump', 'BP-MH-04-1102', 'Sunil Patil', 850.0, 856.0, 6.0, 35.0, 'Wing B1 Floor 3 Slab Pour', 'Wing B1', '2026-08-16'],
    [3, 'Site DG Set 250kVA', 'Generator', 'DG-MH-04-4040', 'Auto-Start', 3100.0, 3104.5, 4.5, 60.0, 'Site Power Backup', 'Basement 1', '2026-08-16']
  ];

  for (const [id, eq, tp, reg, op, smr, emr, rh, dies, work, loc, dt] of mach) {
    await client.query(`
      INSERT INTO machinery_logs (id, equipment_name, equipment_type, registration_no, operator_name, start_hours, end_hours, total_hours, diesel_issued_litres, work_done, location, log_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING;
    `, [id, eq, tp, reg, op, smr, emr, rh, dies, work, loc, dt]);
  }

  // 15. Safety Briefings
  console.log('15. Safety Briefings...');
  await client.query(`
    INSERT INTO safety_briefings (id, site_id, topic, speaker_name, attendee_count, ppe_compliance_pct, briefing_date)
    VALUES (1, 1, 'Work at Height & Mandatory Safety Harness Anchor', 'Anil Deshmukh (Safety Officer)', 38, 100, '2026-08-16')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 16. App Users
  console.log('16. App Users & Site Roles...');
  const users = [
    ['usr_admin', 'admin', 'admin@constructtrack.com', 'Admin / Project Director', 'admin', '+91 9800000001', true],
    ['usr_site_eng', 'site_engineer', 'engineer@constructtrack.com', 'Rutuja (Site Engineer)', 'site_engineer', '+91 9800000002', true],
    ['usr_billing', 'billing', 'billing@constructtrack.com', 'Billing & QS Manager', 'billing', '+91 9800000003', true],
    ['usr_developer', 'developer', 'developer@constructtrack.com', 'Developer / Builder', 'developer', '+91 9800000004', true]
  ];

  for (const [id, username, email, name, role, phone, verified] of users) {
    await client.query(`
      INSERT INTO app_users (id, username, email, name, role, phone, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
    `, [id, username, email, name, role, phone, verified]);
  }

  console.log('================================================================');
  console.log('🎉 SEEDING COMPLETE: 70 FLATS, 6,832 TASKS, ALL DATA READY!');
  console.log('================================================================');

  await client.end();
}

seedMasterProject().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal seed error:', err.message);
  process.exit(1);
});
