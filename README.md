# [Where's the News?](https://wheres-the-news.vercel.app/)

Where's the News? is a browser-based geography and news game inspired by games such as Wordle and GeoGuessr. Players are presented with news or historical events from around the world and must guess where each event occurred by selecting a location on an interactive map.

Each game consists of five stages. Players earn points based on how close their guess is to the correct location. The game combines news, history, and geography to create an entertaining and educational experience.

## Features

- Browser-based geography and news game
- Five stages per game
- Current and historical news events
- Interactive 3D world map
- Location-based guessing
- Distance-based scoring
- User accounts and authentication
- Player score and performance history
- Leaderboard
- AI-generated news summaries
- Translation of international news into English
- Automated news collection

## Game Modes

### Current Mode

Uses recent news and events from around the world.

### Historical Mode

Uses historical news and events from around the world.

### Default Mode

Uses a combination of current and historical events.

## How to Play

1. Open the website.
2. Create an account, log in, or continue to the game.
3. Select a game mode.
4. Start the game.
5. Read the provided news or event information.
6. Place a pin on the map where you think the event occurred.
7. Submit your guess.
8. Receive a score based on the accuracy of your guess.
9. Continue until all five stages are completed.
10. View your final score and compare it with other players on the leaderboard.

## Scoring

Each stage awards between **0 and 1,000 points** based on how close the player's guess is to the correct location.

The closer the guess is to the actual location, the more points the player receives.

Each game contains five stages, giving players a maximum possible score of:

**5,000 points**

## Technology Stack

### Front End

- **Next.js** – Web application framework
- **React.js** – Interactive user interface
- **HTML** – Website structure
- **CSS** – Website styling
- **CesiumJS** – Interactive 3D globe and map

### Back End

- **Next.js** – Server-side application functionality
- **Node.js** – Server-side logic and API endpoints
- **Supabase** – Authentication and database services
- **PostgreSQL** – Application data storage

### News and AI

- **Python** – Scripts for retrieving news headlines and articles through APIs
- **News APIs** – Sources for news headlines and articles
- **AI Model** – Summarizes, translates, and processes news content for the game

## News and AI Processing

Python scripts are used to retrieve news headlines and articles through news APIs.

Before an event is added to the game, an AI model processes the news content. The AI model is used to:

- Summarize the news article
- Translate non-English news into English
- Remove or rewrite information that may reveal the location
- Prepare the event information for gameplay

The processed events can then be stored in the database and displayed to players during a game.

## Database

Supabase and PostgreSQL are used to store application data, including:

- User accounts
- News and historical events
- Event locations
- Player guesses
- Stage scores
- Final scores
- Player performance history
- Leaderboard data

## Game Flow

```text
Home Page
    |
    +-- Create Account
    |
    +-- Login
    |
    +-- Play
          |
          v
   Select Game Mode
          |
          +-- Current
          +-- Historical
          +-- Default
          |
          v
      Start Game
          |
          v
   Display Event
     and Map
          |
          v
    Place a Pin
          |
          v
    Submit Guess
          |
          v
   Calculate Score
          |
          v
    Display Score
          |
          v
     Next Stage
          |
          v
  Complete 5 Stages
          |
          v
    Final Score
          |
          v
 Update Leaderboard
```

## Application Architecture

```text
                  +--------------------+
                  |        User        |
                  |    Web Browser     |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |     Front End      |
                  |                    |
                  | Next.js            |
                  | React.js           |
                  | HTML / CSS         |
                  | CesiumJS           |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |      Back End      |
                  |                    |
                  | Next.js            |
                  | Node.js            |
                  | API Endpoints      |
                  | Game Logic         |
                  | Score Calculation  |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |      Supabase      |
                  |     PostgreSQL     |
                  |                    |
                  | Users              |
                  | Events             |
                  | Guesses            |
                  | Scores             |
                  | Leaderboard        |
                  +--------------------+


                 NEWS PROCESSING

                  +--------------------+
                  |      News API      |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |   Python Scripts   |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |      AI Model      |
                  |                    |
                  | Summarize          |
                  | Translate          |
                  | Remove Clues       |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  |      Supabase      |
                  |     PostgreSQL     |
                  +--------------------+
```

## Project Structure

```text
wheres-the-news/
|
├── app/
│   ├── api/
│   ├── game/
│   ├── leaderboard/
│   ├── login/
│   ├── register/
│   └── profile/
│
├── components/
│
├── lib/
│
├── public/
│
├── scripts/
│   ├── fetch_news.py
│   └── process_news.py
│
├── styles/
│
├── .env.local
├── package.json
├── requirements.txt
└── README.md
```

## Project Goals

Where's the News? is designed to:

- Provide an entertaining way to learn about news and historical events
- Improve players' knowledge of world geography
- Introduce players to events from different parts of the world
- Challenge players to identify where events occurred
- Track player scores and performance
- Allow players to compare their results through a leaderboard
