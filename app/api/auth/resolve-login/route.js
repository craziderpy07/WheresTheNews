import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { username } = await request.json();
    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: 'Enter a valid username.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username_lower', username.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!data?.email) {
      return NextResponse.json({ error: 'Incorrect email/username or password.' }, { status: 401 });
    }

    return NextResponse.json({ email: data.email });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
