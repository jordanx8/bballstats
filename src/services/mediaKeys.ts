/**
 * Pure helpers shared by the media build script and the UI so that player
 * names from box scores line up with names from the media lookup table.
 */
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

export function normalizeName(name: string): string {
  const tokens = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.'’`,]/g, '')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}
