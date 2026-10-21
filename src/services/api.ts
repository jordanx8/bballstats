import { Game, UserStatsSummary } from '../types';
import { computeStatsSummaryClient } from './statsCalculator';
import defaultGames from '../../data/games.json';

const API_BASE = '/api';

export async function fetchGames(): Promise<Game[]> {
  // 1. Try local Express API if running in dev mode with server
  try {
    const res = await fetch(`${API_BASE}/games`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_err) {
    // API server not present (e.g. static on GitHub Pages)
  }

  // 2. Direct bundled JSON data (Single Source of Truth from data/games.json)
  return (defaultGames as unknown as Game[]) || [];
}

export async function fetchGameById(id: string): Promise<Game> {
  const games = await fetchGames();
  const game = games.find(g => g.id === id);
  if (!game) throw new Error('Game not found');
  return game;
}

export async function updateGame(id: string, updates: { notes?: string; arena?: string }): Promise<Game> {
  try {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.game;
    }
  } catch (_err) {
    // Static mode
  }

  const games = await fetchGames();
  const game = games.find(g => g.id === id);
  if (!game) throw new Error('Game not found');
  if (updates.notes !== undefined) game.notes = updates.notes;
  if (updates.arena !== undefined) game.arena = updates.arena;
  return game;
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
