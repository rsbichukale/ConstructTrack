import { NextResponse } from 'next/server';
import { generateInitialFlats, generateInitialFlatTasks, INITIAL_SITES, INITIAL_ROOM_ZONES, INITIAL_CONTRACTORS, INITIAL_TASK_CATALOG } from '@/lib/seedData';

export async function GET() {
  const flats = generateInitialFlats();
  const flatTasks = generateInitialFlatTasks(flats);

  return NextResponse.json({
    success: true,
    message: 'Database seeded successfully',
    summary: {
      sites: INITIAL_SITES.length,
      flats: flats.length,
      roomZones: INITIAL_ROOM_ZONES.length,
      masterTasks: INITIAL_TASK_CATALOG.length,
      flatTaskInstances: flatTasks.length,
    },
    data: {
      sites: INITIAL_SITES,
      roomZones: INITIAL_ROOM_ZONES,
      contractors: INITIAL_CONTRACTORS,
      taskCatalog: INITIAL_TASK_CATALOG,
      flats,
      flatTasks,
    }
  });
}
