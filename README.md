# Where's the News?

Where's the News? is a browser-based geography and news game inspired by games such as Wordle and GeoGuessr. Players are given news events from around the world and must guess where each event occurred by selecting a location on an interactive map.

Each game consists of five stages. Players earn points based on how close their guess is to the correct location. The game combines current events, history, and geography into an interactive experience.

## Features

- Five-stage geography guessing game
- Current and historical news events
- Interactive world map
- Location-based scoring
- User accounts and authentication
- Player score history
- Leaderboard
- AI-generated news summaries
- Translation of international news into English
- Automated news collection

## Game Modes

**Current Mode**  
Uses recent news and events from around the world.

**Historical Mode**  
Uses historical news and events.

**Default Mode**  
Uses a combination of current and historical events.

## How to Play

1. Open the website.
2. Select a game mode.
3. Read the provided news or event summary.
4. Select a location on the map.
5. Submit your guess.
6. Receive a score based on the accuracy of your guess.
7. Repeat for all five stages.
8. View your final score and compare it with other players.

## Scoring

Each stage awards between **0 and 1,000 points** based on the distance between the player's guess and the correct location.

With five stages per game, the maximum possible score is:

**5,000 points**

## Technology Stack

### Front End

- Next.js
- React.js
- HTML
- CSS
- CesiumJS

### Back End

- Next.js
- Node.js
- Supabase
- PostgreSQL

### News and AI

- Python
- News APIs
- AI model for summarization and translation

## AI and News Processing

Python scripts retrieve news headlines and articles through news APIs. An AI model processes the collected news before it is used in the game.

The AI model can:

- Summarize news articles
- Translate international news into English
- Remove information that may reveal the event's location

The processed events are stored in the database and used during gameplay.

## Database

Supabase and PostgreSQL are used to store application data such as:

- Users
- News and historical events
- Event locations
- Player guesses
- Scores
- Game history
- Leaderboard data

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd wheres-the-news
