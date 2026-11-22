/** Friendly names for box score sites we know, matched by domain or subdomain. */
const KNOWN_SITES: { domain: string; name: string }[] = [
  { domain: 'basketball-reference.com', name: 'Basketball-Reference' },
  { domain: 'sports-reference.com', name: 'Sports-Reference' },
  { domain: 'espn.com', name: 'ESPN' },
];

/**
 * Display name for the site a URL points to: a friendly name for known sites,
 * otherwise the host without a leading "www.". Returns null if the URL can't be parsed.
 */
export function sourceSiteName(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;

  const known = KNOWN_SITES.find(s => host === s.domain || host.endsWith(`.${s.domain}`));
  if (known) return known.name;

  return host.replace(/^www\./, '');
}
