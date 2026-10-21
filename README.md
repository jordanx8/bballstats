# 🏀 CourtPass — Attended Basketball Game & Boxscore Tracker

CourtPass is a Vite + React web application designed for basketball fans to log every game they attend in person, scrape full box scores from **Basketball Reference** (NBA/WNBA) and **Sports Reference** (NCAA Men's College Basketball), persist everything to a local `data/games.json` file, and view deep analytics on teams and players they've seen live.

Styled in the official **New Orleans Pelicans color scheme** (Deep Navy `#0C2340`, Warm Gold `#B4975A`/`#C69214`, and Crimson Red `#C8102E`).

All game additions and removals are managed cleanly via **GitHub Actions** (`workflow_dispatch`), which scrape, commit data updates, and automatically re-deploy the updated static site to **GitHub Pages**.

---

## ✨ Features

- **New Orleans Pelicans Theme**: Custom-styled UI with authentic Pelicans Navy, Metallic Gold, and Crimson Red colorways.
- **Multi-Source Web Scraping**:
  - **Basketball Reference** (e.g. `https://www.basketball-reference.com/boxscores/202411110NOP.html`)
  - **Sports Reference CBB** (e.g. `https://www.sports-reference.com/cbb/boxscores/2024-11-06-20-louisiana-state.html`)
- **Dashboard Analytics**:
  - **Most Seen Teams**: Frequency, win/loss records when you attend, win percentage, PPG, and home/away splits.
  - **Most Seen Players**: Frequency, scoring averages (PPG), rebounds (RPG), assists (APG), steals, blocks, and career-highs witnessed.
  - **Top Single-Game Scoring Performances**: Direct leaderboard of the highest-scoring individual performances you've seen live.
  - **Venues & Arenas**: Track every arena visited.
- **Chronological Games Journal**:
  - Search by player, team, arena, date, or personal note.
  - Filter by league (NBA, NCAA, WNBA) and sort by date, total points, or blowout margin.
- **Full Box Score Viewer**:
  - Quarter/half line scores and final scores.
  - Starters, bench reserves, and team totals tables with MP, FG, 3P, FT, TRB, AST, STL, BLK, TOV, PF, PTS, and +/-.
  - Editable personal memory notes field for every game.
- **Static Hosting on GitHub Pages**:
  - Pure static frontend deployed to GitHub Pages reading directly from [`data/games.json`](data/games.json).
  - 0 external runtime server dependencies.

---

## 🌐 Managing Games via GitHub Actions

### 1. Add a Game
1. Go to your repository's **Actions** tab on GitHub.
2. Select **"Scrape Game & Deploy to GitHub Pages"** in the left sidebar.
3. Click **Run workflow**.
4. Paste the Basketball-Reference or Sports-Reference URL in the **Boxscore URL** field and enter any optional personal notes.
5. Click the green **Run workflow** button.

### 2. Remove a Game
1. Go to your repository's **Actions** tab on GitHub.
2. Select **"Remove Game & Deploy to GitHub Pages"** in the left sidebar.
3. Click **Run workflow**, enter the **Game ID** (e.g. `nba-202411110NOP` or the boxscore URL), and click **Run workflow**.

---

## 🤖 Local CLI Commands

You can also run the scraper or delete script locally via CLI:

```bash
# Install dependencies
npm install

# Start local preview server
npm run dev

# Scrape & add a game locally:
npm run scrape -- --url "https://www.basketball-reference.com/boxscores/202411110NOP.html" --notes "Sat in lower bowl with friends"

# Remove a game locally:
npm run delete-game -- --target "nba-202411110NOP"
```

---

## 📁 Project Structure

```
├── .github/workflows/
│   ├── scrape-and-deploy.yml   # Manual workflow to scrape + commit + deploy
│   ├── remove-game.yml         # Manual workflow to remove game + commit + deploy
│   └── deploy-pages.yml        # Automatic deploy on push to main
├── data/
│   └── games.json              # Local persistent JSON database of all attended games
├── scripts/
│   ├── scrape-game.ts          # CLI scraping entrypoint
│   └── delete-game.ts          # CLI delete entrypoint
├── server/
│   ├── index.ts                # Express REST API
│   ├── scraper.ts              # Cheerio/Curl scraper for Basketball & Sports Reference
│   └── storage.ts              # JSON file reader/writer & stat aggregator
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Most seen teams, players, arenas & scoring leaderboards
│   │   ├── GamesTable.tsx      # Chronological journal table with search & filters
│   │   ├── GameBoxscoreView.tsx# Full player box score view & scoreboard
│   │   └── Navbar.tsx          # App navigation header in Pelicans theme
│   ├── services/
│   │   ├── api.ts              # API client with static fallback
│   │   └── statsCalculator.ts  # Client-side statistics aggregator for GitHub Pages
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```
