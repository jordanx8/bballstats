/**
 * Venue alias table.
 *
 * Box score sources spell the same arena several ways. List every spelling you
 * have seen under the name you want displayed; anything not listed is shown as-is.
 * Matching ignores case, punctuation and extra whitespace.
 */
export const VENUE_ALIASES: Record<string, string[]> = {
  'Pete Maravich Assembly Center': [
    'Maravich Assembly Center, Baton Rouge, Louisiana',
    'Pete Maravich Assembly Center (Baton Rouge, LA)',
    'Pete Maravich Assembly Center, Baton Rouge, Louisiana',
    'PMAC',
  ],
  'Smoothie King Center': [
    'Smoothie King Center, New Orleans, Louisiana',
    'Smoothie King Center (New Orleans, LA)',
  ],
};

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const LOOKUP = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(VENUE_ALIASES)) {
  LOOKUP.set(squash(canonical), canonical);
  for (const alias of aliases) LOOKUP.set(squash(alias), canonical);
}

export function canonicalVenue(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  return LOOKUP.get(squash(raw)) ?? raw;
}
