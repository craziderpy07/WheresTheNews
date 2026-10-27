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
    if (data?.email) return NextResponse.json({ email: data.email });

    // existing accounts may have a username in auth metadata but no profiles row
    // supabase admin pagination avoids silently ignoring users after the first page
    let page = 1;
    while (true) {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (usersError) throw usersError;
      const matched = users.users.find((user) =>
        user.user_metadata?.username?.trim().toLowerCase() === username.trim().toLowerCase()
      );
      if (matched?.email) return NextResponse.json({ email: matched.email });
      if (users.users.length < 1000) break;
      page += 1;
    }
    return NextResponse.json({ error: 'Incorrect email/username or password.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
