import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadGames } from '../server/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const games = loadGames();
const publicDir = path.resolve(__dirname, '../public/data');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'games.json'), JSON.stringify(games, null, 2), 'utf-8');
console.log(`Synced ${games.length} games to public/data/games.json`);
