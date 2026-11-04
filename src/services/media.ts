import mediaData from '../../data/media.json';
import { normalizeName } from './mediaKeys';

interface MediaLookup {
  teams: Record<string, string>;
  players: Record<string, string>;
}

const media = mediaData as unknown as MediaLookup;

export function getTeamLogo(teamName: string): string | undefined {
  return media.teams[teamName];
}

export function getPlayerHeadshot(playerName: string): string | undefined {
  return media.players[normalizeName(playerName)];
}
