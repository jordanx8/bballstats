# 🏀 CourtPass — Attended Basketball Game & Boxscore Tracker

CourtPass is a Vite + React web application designed for basketball fans to log every game they attend in person, scrape full box scores from **Basketball Reference** (NBA/WNBA) and **Sports Reference** (NCAA Men's College Basketball), persist everything to a local `data/games.json` file, and view deep analytics on teams and players they've seen live.

It is fully deployable to **GitHub Pages** and includes a **GitHub Actions workflow** (`workflow_dispatch`) that allows you to scrape new games on demand with automatic commit, data persistence, and redeployment.

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

## 🤖 Scraping via CLI

You can scrape and log a game anytime from the command line:

```bash
npm run scrape -- --url "https://www.basketball-reference.com/boxscores/202411110NOP.html" --notes "Sat in section 112 with friends"
```

Or for College Basketball:
```bash
npm run scrape -- --url "https://www.sports-reference.com/cbb/boxscores/2024-11-06-20-louisiana-state.html" --notes "Season opener at PMAC"
```

---

## 🌐 Deploying to GitHub Pages & Running GitHub Action

### Step 1: Enable GitHub Pages
1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.

### Step 2: Manually Scrape a Game via GitHub Action
Whenever you attend a game and want to log it:
1. Go to your repository's **Actions** tab.
2. Select **"Scrape Game & Deploy to GitHub Pages"** in the left sidebar.
3. Click **Run workflow**.
4. Paste the Basketball-Reference or Sports-Reference URL into the **Boxscore URL** field.
5. (Optional) Enter personal memory notes in the **Personal notes** field.
6. Click the green **Run workflow** button.

The workflow will:
1. Fetch and scrape the box score data using the scraper CLI.
2. Update [`data/games.json`](data/games.json).
3. Commit and push the updated JSON back to the `main` branch.
4. Build the Vite React application.
5. Re-publish the updated site to GitHub Pages!

---

## 📁 Project Structure

```
├── .github/workflows/
│   ├── scrape-and-deploy.yml   # Manual workflow_dispatch to scrape + commit + deploy
│   └── deploy-pages.yml        # Automatic deploy on push to main
├── data/
│   └── games.json              # Local persistent JSON database of all attended games
├── scripts/
│   ├── scrape-game.ts          # CLI scraping entrypoint
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
