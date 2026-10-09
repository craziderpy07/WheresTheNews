# Where's The News: game history + daily calendar update

This folder contains ONLY the new and modified files. Copy its `app`, `lib`, and
`supabase` folders into your existing Next.js repository root (same place as
`package.json`); **merge folders** and overwrite the individual files included.
It does not include your full application or your existing `.env.local`.

## 1. Make a branch

```powershell
git switch -c feature/game-history
```

Commit or stash any existing edits first. Back up the original files if you
prefer; Git will let you inspect the differences before committing.

## 2. Apply the small additional database migration

You already created the `completed_games` table. In the Supabase SQL Editor,
run `supabase/migrations/002_completed_game_sessions.sql` to add the unique
`session_id` used for idempotency. **Do not rerun the original table-creation SQL
if your table already exists.**

## 3. Create one secret for game-ticket signatures

In PowerShell, generate a strong secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Add the result as one new line in the root `.env.local`:

```text
GAME_SESSION_SECRET=<your-generated-random-string>
```

Use the *same* secret in your Vercel production environment variables when
shipping this code, and redeploy after adding it. Keep it private and out of
Git. Restart `npm run dev` after updating `.env.local`.

The existing `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must already be configured correctly.

## 4. Run and test

```powershell
npm run dev
```

- Sign in, complete all five rounds, and see `Score saved` on the result page.
- Open `/history`. The game should appear with its final score and timestamp.
- Switch to the Daily Calendar. Existing dates in `daily_challenges` will be available; completed dates have check marks.
- Select a previous date and press Play, or select a completed date and Replay.
- Try refreshing results: a session should appear only once in history.
- Try finishing a random game, then verify its record has no challenge date.
- Sign out and open `/history`: it should ask for login.
- Run `npm run build` before merging.

## Files in this update

- `app/api/game/route.js`: optional dates and signed tickets
- `app/api/game/complete/route.js`: authenticated completion, server-side scoring, safe retry
- `app/api/game/history/route.js`: paginated user history
- `app/api/game/calendar/route.js`: available calendar days + personal bests
- `app/play/page.js`: resume/finish/replay/saving
- `app/login/page.js`: support safe `?next=` return URL after sign-in
- `app/history/page.js` and `app/history/history.css`: new history/calendar UI
- `lib/gameServer.js`: don't invent a random daily challenge for a past day with no saved selection
- `lib/gameSession.js`: signed ticket issuance and verification, authorization
- `lib/gameRules.js`: included unchanged for context; you can skip this file
- `supabase/migrations/002_completed_game_sessions.sql`: unique session ID column/index

## Design decisions and known limits

- Challenge dates use `America/Los_Angeles`, matching your current app.
- Missing past dates are **not** auto-created; the calendar only permits dates
  already present in `daily_challenges`. Today's challenge still auto-creates.
- Completed games are stored under verified `auth.users.id`; normal users get
  SELECT-only access to their own rows, while the trusted server inserts rows.
- Results are stored as one final score per game; individual guess coordinates
  are **not** persisted in Supabase (they still live in browser localStorage).
- Scores are recalculated by the server, but this is NOT anti-cheat protection:
  your existing `/api/game/guess` reveals the correct answer after a guess.
  Competitive leaderboards would require authoritative per-round state.
- A signed session expires after 90 days. Existing games from before this
  update lack signed tickets and cannot be retroactively authenticated.
- Previously completed daily challenges whose source events later become
  inactive may not be replayable with the current `gameServer` logic.
- The `NavBar.js` source wasn't provided, so the update adds History links to
  the play page and results, not to the site-wide navigation. Add a link to
  `/history` there when you're ready.
