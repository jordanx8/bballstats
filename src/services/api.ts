import { Game, UserStatsSummary } from '../types';
import { computeStatsSummaryClient } from './statsCalculator';

const API_BASE = '/api';

export async function fetchGames(): Promise<Game[]> {
  // 1. Try local Express API if running
  try {
    const res = await fetch(`${API_BASE}/games`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_err) {
    // API server not present, fallback to static JSON
  }

  // 2. Fallback to static JSON file (for GitHub Pages hosting)
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const staticUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data/games.json`;
    const res = await fetch(staticUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('Failed to load static games.json:', err);
    return [];
  }
}

export async function fetchGameById(id: string): Promise<Game> {
  const games = await fetchGames();
  const game = games.find(g => g.id === id);
  if (!game) throw new Error('Game not found');
  return game;
}

export async function scrapeGameUrl(url: string, notes?: string): Promise<{ success: boolean; isNew: boolean; game: Game; summary: UserStatsSummary; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/games/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, notes }),
    });
    
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.details || errData.error || `Server responded with ${res.status}`);
  } catch (err: any) {
    // If running purely on GitHub Pages static deployment
    throw new Error(
      err.message || 'Scraping requires running the local server or triggering the GitHub Action workflow.'
    );
  }
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

  // Fallback in-memory
  const games = await fetchGames();
  const game = games.find(g => g.id === id);
  if (!game) throw new Error('Game not found');
  if (updates.notes !== undefined) game.notes = updates.notes;
  if (updates.arena !== undefined) game.arena = updates.arena;
  return game;
}

export async function deleteGame(id: string): Promise<{ success: boolean; summary: UserStatsSummary }> {
  try {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_err) {
    // Static mode
  }
  const games = (await fetchGames()).filter(g => g.id !== id);
  return { success: true, summary: computeStatsSummaryClient(games) };
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
