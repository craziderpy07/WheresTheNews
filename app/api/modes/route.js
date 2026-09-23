import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    milestone: 35,
    modes: [
      { id: 'historical', name: 'Historical', enabled: true },
      { id: 'current', name: 'Current', enabled: true },
      { id: 'default', name: 'Default', enabled: false, note: 'Next milestone' }
    ]
  });
}
