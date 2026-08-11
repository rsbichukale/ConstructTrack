import { NextResponse } from 'next/server';
import { generateInitialFlats, generateInitialFlatTasks } from '@/lib/seedData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flatId = searchParams.get('flatId');

  const flats = generateInitialFlats();
  const flatTasks = generateInitialFlatTasks(flats);

  if (flatId) {
    const tasks = flatTasks.filter(t => t.flatId === parseInt(flatId, 10));
    return NextResponse.json({ success: true, count: tasks.length, data: tasks });
  }

  return NextResponse.json({ success: true, count: flatTasks.length, data: flatTasks });
}
