import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeBoxscore } from './scraper.js';
import { loadGames, saveGames, addGame, deleteGame, computeStatsSummary } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Get all games
app.get('/api/games', (_req: Request, res: Response) => {
  try {
    const games = loadGames();
    res.json(games);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load games', details: err.message });
  }
});

// 2. Get single game by ID
app.get('/api/games/:id', (req: Request, res: Response) => {
  try {
    const games = loadGames();
    const gameId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const game = games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve game', details: err.message });
  }
});

// 3. Scrape and save a game URL
app.post('/api/games/scrape', async (req: Request, res: Response) => {
  const { url, notes } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  try {
    console.log(`[Scraper] Scraping: ${url}`);
    const scrapedGame = await scrapeBoxscore(url);
    if (notes) {
      scrapedGame.notes = notes;
    }
    
    const { game, isNew } = addGame(scrapedGame);
    const summary = computeStatsSummary(loadGames());

    res.json({
      success: true,
      isNew,
      game,
      summary,
      message: isNew ? 'Game successfully added!' : 'Game already in library; updated stats.'
    });
  } catch (err: any) {
    console.error(`[Scraper Error] ${err.message}`);
    res.status(500).json({
      error: 'Failed to scrape game',
      details: err.message || 'Make sure the URL is a valid Basketball-Reference or Sports-Reference box score page.',
    });
  }
});

// 4. Update game notes or info
app.put('/api/games/:id', (req: Request, res: Response) => {
  try {
    const games = loadGames();
    const gameId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idx = games.findIndex(g => g.id === gameId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { notes, arena } = req.body;
    if (notes !== undefined) games[idx].notes = notes;
    if (arena !== undefined) games[idx].arena = arena;

    saveGames(games);
    res.json({ success: true, game: games[idx] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update game', details: err.message });
  }
});

// 5. Delete a game
app.delete('/api/games/:id', (req: Request, res: Response) => {
  try {
    const gameId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = deleteGame(gameId);
    if (!success) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const summary = computeStatsSummary(loadGames());
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete game', details: err.message });
  }
});

// 6. Get aggregate stats summary
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const games = loadGames();
    const summary = computeStatsSummary(games);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute stats', details: err.message });
  }
});

// 7. Bulk import games
app.post('/api/games/import', (req: Request, res: Response) => {
  try {
    const { games } = req.body;
    if (!Array.isArray(games)) {
      return res.status(400).json({ error: 'Expected an array of game objects' });
    }
    saveGames(games);
    res.json({ success: true, count: games.length, summary: computeStatsSummary(games) });
  } catch (err: any) {
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
});

// Serve frontend in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  const indexHtml = path.join(distPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('CourtPass Backend API Running. Start Vite dev server for frontend in dev mode.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🏀 CourtPass Server listening on http://localhost:${PORT}`);
});
