import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Billing module has been removed. Money tracking is handled externally.',
  });
}
