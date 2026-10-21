# 🏀 CourtPass — Attended Basketball Game & Boxscore Tracker

CourtPass is a Vite + React web application designed for basketball fans to log every game they attend in person, scrape full box scores from **Basketball Reference** (NBA/WNBA) and **Sports Reference** (NCAA Men's College Basketball), persist everything to a local `data/games.json` file, and view deep analytics on teams and players they've seen live.

It is fully deployable to **GitHub Pages** and includes **GitHub Actions workflows** (`workflow_dispatch`) that allow you to scrape new games or remove games on demand with automatic commit, data persistence, and redeployment.

---

## ✨ Features

- **Multi-Source Web Scraping**: Accepts box score links from:
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
- **Dual Persistence Architecture**:
  - Local JSON storage in [`data/games.json`](data/games.json).
  - Works with local Node/Express backend or 100% static on **GitHub Pages**.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full Stack Dev Server (React + Express API)
```bash
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤖 CLI Commands

### Scrape & Add a Game
```bash
npm run scrape -- --url "https://www.basketball-reference.com/boxscores/202411110NOP.html" --notes "Sat in section 112 with friends"
```

### Remove a Game
```bash
npm run delete-game -- --target "nba-202411110NOP"
```

---

## 🌐 GitHub Actions & GitHub Pages

### Step 1: Enable GitHub Pages
1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.

### Step 2: Add a Game via GitHub Action
1. Go to your repository's **Actions** tab.
2. Select **"Scrape Game & Deploy to GitHub Pages"** in the left sidebar.
3. Click **Run workflow**, paste your box score URL, and click **Run workflow**.

### Step 3: Remove a Game via GitHub Action
1. Go to your repository's **Actions** tab.
2. Select **"Remove Game & Deploy to GitHub Pages"** in the left sidebar.
3. Click **Run workflow**, enter the **Game ID** (e.g. `nba-202411110NOP` or the box score URL), and click **Run workflow**.

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
│   ├── delete-game.ts          # CLI delete entrypoint
│   └── sync-data.ts            # Mirrors data/games.json into public/ for static Vite builds
├── server/
│   ├── index.ts                # Express REST API
│   ├── scraper.ts              # Cheerio/Curl scraper for Basketball & Sports Reference
│   └── storage.ts              # JSON file reader/writer & stat aggregator
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Most seen teams, players, arenas & scoring leaderboards
│   │   ├── GamesTable.tsx      # Chronological journal table with search & filters
│   │   ├── GameBoxscoreView.tsx# Full player box score view & scoreboard
│   │   ├── Navbar.tsx          # App navigation header
│   │   └── SubmitGameModal.tsx # URL submission modal & GitHub Action instructions
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
