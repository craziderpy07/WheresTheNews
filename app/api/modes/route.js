import { NextResponse } from 'next/server';
import { GAME_MODES } from '../../../lib/gameRules';

export async function GET() {
  return NextResponse.json({
    modes: GAME_MODES
  });
}
