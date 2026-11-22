import { Game, UserStatsSummary } from '../types';
import { computeStatsSummaryClient } from './statsCalculator';
import { canonicalVenue } from './venues';
import defaultGames from '../../data/games.json';

const API_BASE = '/api';

/** Set once the local Express server answers; false on the static GitHub Pages site. */
let serverAvailable = false;

/** Whether edits (like notes) can be saved where the app is running. Known after fetchGames(). */
export function isServerAvailable(): boolean {
  return serverAvailable;
}

/** Apply venue aliases in place (idempotent) so every view sees one name per arena. */
function normalizeGame(game: Game): Game {
  game.arena = canonicalVenue(game.arena);
  return game;
}

export async function fetchGames(): Promise<Game[]> {
  // 1. Try local Express API if running in dev mode with server
  try {
    const res = await fetch(`${API_BASE}/games`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        serverAvailable = true;
        return data.map(normalizeGame);
      }
    }
  } catch (_err) {
    // API server not present (e.g. static on GitHub Pages)
  }
  serverAvailable = false;

  // 2. Direct bundled JSON data (Single Source of Truth from data/games.json)
  return ((defaultGames as unknown as Game[]) || []).map(normalizeGame);
}

export async function fetchGameById(id: string): Promise<Game> {
  const games = await fetchGames();
  const game = games.find(g => g.id === id);
  if (!game) throw new Error('Game not found');
  return game;
}

/**
 * Save edits through the local server. Throws if it can't be saved, rather than
 * pretending: the static site has nowhere to write (use the Update Game Notes Action).
 */
export async function updateGame(id: string, updates: { notes?: string; arena?: string }): Promise<Game> {
  const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Could not save changes (server responded ${res.status}).`);
  const data = await res.json();
  return normalizeGame(data.game);
}

export async function fetchStats(): Promise<UserStatsSummary> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (res.ok) return await res.json();
  } catch (_err) {
    // Fallback to client computation
  }

  const games = await fetchGames();
  return computeStatsSummaryClient(games);
}
