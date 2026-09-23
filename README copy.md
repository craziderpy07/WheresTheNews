# Where's the News? — 35% Implementation Milestone

This version replaces the original Flask/SQLite prototype with the requested architecture:

- **Supabase PostgreSQL** for users/profiles, daily headlines, guesses, scores, and leaderboard data
- **Next.js + Node.js** for routing, server-side logic, and API endpoints
- **React + HTML/CSS** for the interactive front end
- **CesiumJS** for the map/globe technology
- **AI summarization pipeline** for converting headlines into location-safe English clues
- **Python** for fetching headlines from a news API and inserting processed records into Supabase

## 35% scope

The project still intentionally implements **7 of 20 requirements = 35%**:

1. Home page
2. Create account
3. Login with email or username
4. Persistent login session
5. Play opens game configuration
6. Historical mode selection
7. Current mode selection

Requirement 8 (Default mode) and Requirements 9-20 are intentionally incomplete. The Cesium globe shown on the game-setup page is a technology preview; the actual five-stage map guessing workflow is not implemented yet.

## Project structure

```text
wheres-the-news-35-next/
├── app/
│   ├── api/
│   │   ├── auth/resolve-login/route.js
│   │   └── modes/route.js
│   ├── login/page.js
│   ├── signup/page.js
│   ├── play/page.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── CesiumPreview.js
│   └── NavBar.js
├── lib/
│   ├── supabaseAdmin.js
│   └── supabaseClient.js
├── scripts/
│   ├── ingest_headlines.py
│   └── requirements.txt
├── supabase/migrations/001_schema.sql
├── .env.example
└── package.json
```

## 1. Create the Supabase project

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/migrations/001_schema.sql`.
4. Copy `.env.example` to `.env.local`.
5. Add your project URL, anon key, and service-role key.

The service-role key is used only by the server-side username lookup endpoint and the Python ingestion script. Never expose it through a `NEXT_PUBLIC_` variable.

## 2. Install and run the Next.js app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Supabase email confirmation

For an easy classroom demo, you can temporarily disable email confirmation in your Supabase Auth settings. If email confirmation remains enabled, users must confirm their email before the first login.

## 3. Python news ingestion setup

Create a Python environment and install dependencies:

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Then:

```bash
pip install -r scripts/requirements.txt
python scripts/ingest_headlines.py
```

The script expects a NewsAPI key plus an AI endpoint/model configured in `.env.local` or the shell environment. It fetches English headlines, asks the AI model to create a concise clue while removing location giveaways, and inserts processed rows into `daily_headlines`.

The ingestion pipeline is scaffolding for later requirements and is **not counted as completed gameplay** in this 35% milestone.

## Supabase data model

- `auth.users`: Supabase-managed authentication credentials
- `profiles`: username/email application profile
- `daily_headlines`: original headline + AI-created location-safe clue + coordinates/metadata
- `guesses`: map guesses and per-stage results
- `scores`: completed-game totals
- `leaderboard`: PostgreSQL view derived from completed scores

Passwords are handled by **Supabase Auth** and are not stored in your application tables.

## In-class demo for the 35% milestone

1. Run the Next.js website.
2. Show the home page.
3. Create an account and show the profile row in Supabase.
4. Log out and log back in with email.
5. Log out and demonstrate username login.
6. Refresh the browser to show Supabase session persistence.
7. Open **Play** and select **Historical**.
8. Select **Current**.
9. Explain that **Default** is intentionally disabled because Requirement 8 belongs to the next milestone.
10. Show the CesiumJS globe preview and explain that interactive stage guessing begins after the 35% milestone.
11. Open the Supabase SQL schema and Python ingestion script to explain the planned headline → AI clue → database pipeline.

## Daily game concept included in this milestone

The 35% project now also visibly communicates the intended core game experience:

- The site is a **browser-based game inspired by Wordle and GeoGuessr**.
- A daily challenge is designed around **five news headlines from across the globe**.
- Each headline will ask the player to **pinpoint the story location on the CesiumJS globe**.
- Each round will award **0-1,000 points based on geographic distance**, for a maximum planned daily score of **5,000 points**.
- The home page and Play page include a five-stage daily challenge/scoring preview.

These additions are currently **UI/architecture scaffolding** and do not change the formal 35% requirement count. The actual five-round submission loop, coordinate comparison, distance calculation, score persistence, and completed-game leaderboard remain Requirements 9-20 and are intentionally not marked complete yet.
