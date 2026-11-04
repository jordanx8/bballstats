import { useEffect, useState } from 'react';

/**
 * Minimal hash router so every page (including individual box scores, players,
 * teams and seasons) has a shareable URL and a working browser back button.
 * Hash routing works on GitHub Pages without any server rewrite rules.
 */
export type Route =
  | { name: 'dashboard' }
  | { name: 'games' }
  | { name: 'game'; id: string }
  | { name: 'players' }
  | { name: 'player'; playerName: string }
  | { name: 'teams' }
  | { name: 'team'; teamName: string }
  | { name: 'seasons' }
  | { name: 'season'; season: string };

const enc = encodeURIComponent;

export const paths = {
  dashboard: '/',
  games: '/games',
  game: (id: string) => `/games/${enc(id)}`,
  players: '/players',
  player: (name: string) => `/players/${enc(name)}`,
  teams: '/teams',
  team: (name: string) => `/teams/${enc(name)}`,
  seasons: '/seasons',
  season: (season: string) => `/seasons/${enc(season)}`,
};

function dec(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseHash(hash: string): Route {
  const [section, arg] = hash.replace(/^#/, '').split('/').filter(Boolean);
  const value = arg ? dec(arg) : undefined;

  switch (section) {
    case 'games':
      return value ? { name: 'game', id: value } : { name: 'games' };
    case 'players':
      return value ? { name: 'player', playerName: value } : { name: 'players' };
    case 'teams':
      return value ? { name: 'team', teamName: value } : { name: 'teams' };
    case 'seasons':
      return value ? { name: 'season', season: value } : { name: 'seasons' };
    default:
      return { name: 'dashboard' };
  }
}

const ROUTE_EVENT = 'courtpass:route';

function historyIndex(): number {
  const state = window.history.state;
  return state && typeof state.idx === 'number' ? state.idx : 0;
}

export function navigate(path: string): void {
  const target = `#${path}`;
  if (window.location.hash === target) return;
  window.history.pushState({ idx: historyIndex() + 1 }, '', target);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

/** Go back one step inside the app, or to `fallback` if the page was opened directly. */
export function goBack(fallback: string): void {
  if (historyIndex() > 0) {
    window.history.back();
  } else {
    window.history.replaceState({ idx: 0 }, '', `#${fallback}`);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const update = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', update);
    window.addEventListener(ROUTE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(ROUTE_EVENT, update);
    };
  }, []);

  return route;
}
