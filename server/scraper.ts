import axios from 'axios';
import * as cheerio from 'cheerio';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Game, PlayerStats, TeamGameData, TeamTotals, SourceType } from '../src/types/index.js';

const execFileAsync = promisify(execFile);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtmlWithCurl(url: string): Promise<string> {
  const curlCmd = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const args = [
    '-s',
    '-L',
    '--compressed',
    '-A', USER_AGENT,
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    url,
  ];

  try {
    const { stdout } = await execFileAsync(curlCmd, args, { maxBuffer: 15 * 1024 * 1024 });
    return stdout;
  } catch (err: any) {
    // If the primary command fails, try the alternative binary name (e.g. 'curl' vs 'curl.exe')
    const altCmd = curlCmd === 'curl.exe' ? 'curl' : 'curl.exe';
    try {
      const { stdout } = await execFileAsync(altCmd, args, { maxBuffer: 15 * 1024 * 1024 });
      return stdout;
    } catch {
      throw new Error(`Curl fetch failed: ${err.message}`);
    }
  }
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (err: any) {
    console.log(`[Scraper] Axios failed (${err.message}), trying curl fallback for ${url}...`);
    return await fetchHtmlWithCurl(url);
  }
}

function parseNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined) return defaultVal;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

function parseNullableNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  const cleaned = String(val).replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '—') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function scrapeBoxscore(url: string): Promise<Game> {
  const cleanUrl = url.trim();
  
  if (!cleanUrl.includes('basketball-reference.com') && !cleanUrl.includes('sports-reference.com')) {
    throw new Error('Unsupported URL. Please enter a valid Basketball Reference or Sports Reference box score URL.');
  }

  const isCbb = cleanUrl.includes('/cbb/');
  const isWnba = cleanUrl.includes('/wnba/');
  const sourceType: SourceType = isCbb ? 'cbb' : isWnba ? 'wnba' : cleanUrl.includes('basketball-reference.com') ? 'nba' : 'sports-reference';

  const rawHtml = await fetchHtml(cleanUrl);
  if (!rawHtml || rawHtml.length < 500) {
    throw new Error('Retrieved page content was empty or blocked.');
  }

  return parseBoxscoreHtml(rawHtml, cleanUrl, sourceType);
}

export function parseBoxscoreHtml(rawHtml: string, url: string, defaultSourceType?: SourceType): Game {
  // Sports Reference frequently puts table HTML inside comment blocks <!-- ... -->
  // Un-comment comments containing table elements so Cheerio can find them
  const processedHtml = rawHtml.replace(/<!--([\s\S]*?)-->/g, '$1');

  const $ = cheerio.load(processedHtml);

  const isCbb = url.includes('/cbb/') || $('title').text().toLowerCase().includes('college basketball');
  const isWnba = url.includes('/wnba/') || $('title').text().toLowerCase().includes('wnba');
  const sourceType: SourceType = defaultSourceType || (isCbb ? 'cbb' : isWnba ? 'wnba' : 'nba');

  // Extract Game ID from URL
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1].replace('.html', '');
  const id = `${sourceType}-${lastPart}`;

  // 1. Parse Scorebox
  const scorebox = $('.scorebox');
  let awayTeamName = '';
  let homeTeamName = '';
  let awayScore = 0;
  let homeScore = 0;
  let awayRecord = '';
  let homeRecord = '';

  const teamBlocks = scorebox.find('> div');
  if (teamBlocks.length >= 2) {
    const awayBlock = $(teamBlocks[0]);
    const homeBlock = $(teamBlocks[1]);

    awayTeamName = awayBlock.find('strong a, a strong, strong').first().text().trim();
    if (!awayTeamName) {
      awayTeamName = awayBlock.find('a').first().text().trim();
    }
    const awayScoreText = awayBlock.find('.score, .scores div').first().text().trim();
    awayScore = parseNumber(awayScoreText, 0);
    awayRecord = awayBlock.find('.scores + div, div:contains("-")').first().text().trim();

    homeTeamName = homeBlock.find('strong a, a strong, strong').first().text().trim();
    if (!homeTeamName) {
      homeTeamName = homeBlock.find('a').first().text().trim();
    }
    const homeScoreText = homeBlock.find('.score, .scores div').first().text().trim();
    homeScore = parseNumber(homeScoreText, 0);
    homeRecord = homeBlock.find('.scores + div, div:contains("-")').first().text().trim();
  }

  // Fallback if scorebox is structured differently (e.g. meta tags or h1)
  if (!awayTeamName || !homeTeamName) {
    const h1Text = $('h1').first().text().trim();
    if (h1Text.includes(' at ')) {
      const match = h1Text.match(/^(.*?)\s+at\s+(.*?)\s+(Box Score|Matchup|,)/i);
      if (match) {
        awayTeamName = awayTeamName || match[1].trim();
        homeTeamName = homeTeamName || match[2].trim();
      }
    } else if (h1Text.includes(' vs. ') || h1Text.includes(' vs ')) {
      const match = h1Text.match(/^(.*?)\s+vs\.?\s+(.*?)\s+(Box Score|Matchup|,)/i);
      if (match) {
        awayTeamName = awayTeamName || match[1].trim();
        homeTeamName = homeTeamName || match[2].trim();
      }
    }
  }

  // Date and Game Meta
  let gameDate = '';
  let formattedDate = '';
  let arena: string | undefined = undefined;
  let attendance: string | number | undefined = undefined;

  // Extract date from meta or scorebox_meta
  const metaText = $('.scorebox_meta, .scorebox .scorebox_meta').text();
  const dateMatch = metaText.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (dateMatch) {
    formattedDate = dateMatch[1];
    const parsedD = new Date(formattedDate);
    if (!isNaN(parsedD.getTime())) {
      gameDate = parsedD.toISOString().split('T')[0];
    }
  }

  // Try extracting date from URL if not found (e.g. 202411120NOP or 2024-11-06-20-louisiana-state)
  if (!gameDate) {
    const bRefDateMatch = lastPart.match(/^(\d{4})(\d{2})(\d{2})/);
    const cbbDateMatch = lastPart.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (bRefDateMatch) {
      gameDate = `${bRefDateMatch[1]}-${bRefDateMatch[2]}-${bRefDateMatch[3]}`;
      const d = new Date(gameDate);
      formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (cbbDateMatch) {
      gameDate = `${cbbDateMatch[1]}-${cbbDateMatch[2]}-${cbbDateMatch[3]}`;
      const d = new Date(gameDate);
      formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  // Arena & Attendance Extraction
  $('.scorebox_meta div, .scorebox_meta p, .scorebox div, .scorebox p').each((_, el) => {
    const t = $(el).text().trim();
    if (!t) return;

    if (/Attendance:\s*([\d,]+)/i.test(t)) {
      const attMatch = t.match(/Attendance:\s*([\d,]+)/i);
      if (attMatch) {
        attendance = attMatch[1].replace(/,/g, '');
      }
    }
    if (/^(?:Arena|Location|Venue):\s*(.+)$/i.test(t)) {
      const match = t.match(/^(?:Arena|Location|Venue):\s*(.+)$/i);
      if (match && match[1]) {
        arena = match[1].trim();
      }
    }
  });

  // If arena was not explicitly labeled with Arena:/Location:, inspect .scorebox_meta child divs
  if (!arena) {
    $('.scorebox_meta > div, .scorebox_meta > p').each((_, el) => {
      if (arena) return;
      const t = $(el).text().trim();
      if (!t) return;

      const isDateOrTime = /(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}:\d{2}\s*(?:AM|PM)|\b\d{4}\b)/i.test(t) &&
                           (t.includes('PM') || t.includes('AM') || /,\s*\d{4}/.test(t));
      const isLogo = /logo/i.test(t) || $(el).find('a[href*="logo"]').length > 0;
      const isAttendance = /attendance/i.test(t);
      const isOfficial = /official/i.test(t);

      if (!isDateOrTime && !isLogo && !isAttendance && !isOfficial && t.length > 2) {
        arena = t;
      }
    });
  }

  // Fallback to arena links if available
  if (!arena) {
    const arenaLink = $('a[href*="/arenas/"], a[href*="/stadiums/"]').first().text().trim();
    if (arenaLink) {
      arena = arenaLink;
    }
  }

  // 2. Parse Line Score table (quarters / halves)
  let lineScoreTable = $('#line_score, #line-score, table.linescore');
  const awayLineScores: number[] = [];
  const homeLineScores: number[] = [];

  if (lineScoreTable.length > 0) {
    const rows = lineScoreTable.find('tbody tr');
    if (rows.length >= 2) {
      // Away row
      const awayCells = $(rows[0]).find('td');
      awayCells.each((idx, cell) => {
        // usually last cell is total (T)
        if (idx < awayCells.length - 1) {
          const val = parseNumber($(cell).text(), 0);
          awayLineScores.push(val);
        }
      });
      // Home row
      const homeCells = $(rows[1]).find('td');
      homeCells.each((idx, cell) => {
        if (idx < homeCells.length - 1) {
          const val = parseNumber($(cell).text(), 0);
          homeLineScores.push(val);
        }
      });
    }
  }

  // 3. Find and Parse Boxscore Tables for Each Team
  const basicTables: { teamKey: string; $table: any }[] = [];

  $('table').each((_, el) => {
    const id = ($(el).attr('id') || '').toLowerCase();
    const classes = ($(el).attr('class') || '').toLowerCase();

    // Ignore partial quarters, halves, overtimes, advanced stats, line scores, four factors
    const isPeriodOrOther =
      id.includes('advanced') ||
      id.includes('-h1') ||
      id.includes('-h2') ||
      id.includes('-1h') ||
      id.includes('-2h') ||
      id.includes('half') ||
      id.includes('-q1') ||
      id.includes('-q2') ||
      id.includes('-q3') ||
      id.includes('-q4') ||
      id.includes('-ot') ||
      id.includes('line_score') ||
      id.includes('line-score') ||
      id.includes('four_factors') ||
      id.includes('four-factors') ||
      id.includes('leaders') ||
      id.includes('plus_minus') ||
      id.includes('plus-minus');

    if (isPeriodOrOther) return;

    // Must be a full game basic stats table:
    // Basketball-Reference: box-XXX-game-basic
    // Sports-Reference CBB: box-score-basic-XXX or XXX-game-basic
    const isFullGameBasic =
      id.endsWith('-game-basic') ||
      id.startsWith('box-score-basic-') ||
      (classes.includes('stats_table') && (id.includes('basic') || id.includes('box')) && !id.includes('q') && !id.includes('h'));

    if (isFullGameBasic) {
      // Avoid duplicate tables for the same team ID
      if (!basicTables.some(t => t.teamKey === id)) {
        basicTables.push({ teamKey: id, $table: $(el) });
      }
    }
  });

  let awayPlayers: PlayerStats[] = [];
  let homePlayers: PlayerStats[] = [];
  let awayTotals: TeamTotals | undefined;
  let homeTotals: TeamTotals | undefined;

  if (basicTables.length >= 2) {
    const awayParsed = parsePlayerTable($, basicTables[0].$table);
    awayPlayers = awayParsed.players;
    awayTotals = awayParsed.totals;

    const homeParsed = parsePlayerTable($, basicTables[1].$table);
    homePlayers = homeParsed.players;
    homeTotals = homeParsed.totals;
  } else if (basicTables.length === 1) {
    const parsed = parsePlayerTable($, basicTables[0].$table);
    awayPlayers = parsed.players;
    awayTotals = parsed.totals;
  }

  // Refine scores and names if missing from scorebox
  if (awayTotals && awayTotals.pts > 0 && awayScore === 0) {
    awayScore = awayTotals.pts;
  }
  if (homeTotals && homeTotals.pts > 0 && homeScore === 0) {
    homeScore = homeTotals.pts;
  }

  // If scorebox team names were missing or partial, grab from table headings or title
  if (!awayTeamName && basicTables[0]) {
    const heading = basicTables[0].$table.closest('.table_wrapper').find('h2, span.section_anchor').first().text();
    awayTeamName = heading.replace(/\(.*?\)/g, '').trim();
  }
  if (!homeTeamName && basicTables[1]) {
    const heading = basicTables[1].$table.closest('.table_wrapper').find('h2, span.section_anchor').first().text();
    homeTeamName = heading.replace(/\(.*?\)/g, '').trim();
  }

  // If arena was not found in scorebox metadata, resolve via home team or URL slug
  if (!arena && (homeTeamName || url)) {
    arena = resolveFallbackArena(homeTeamName, url);
  }

  // Fallback short names
  const awayShort = extractTeamCode(awayTeamName) || 'AWAY';
  const homeShort = extractTeamCode(homeTeamName) || 'HOME';

  const awayTeam: TeamGameData = {
    name: awayTeamName || 'Away Team',
    shortName: awayShort,
    score: awayScore,
    record: awayRecord || undefined,
    lineScores: awayLineScores.length > 0 ? awayLineScores : [awayScore],
    players: awayPlayers,
    totals: awayTotals,
  };

  const homeTeam: TeamGameData = {
    name: homeTeamName || 'Home Team',
    shortName: homeShort,
    score: homeScore,
    record: homeRecord || undefined,
    lineScores: homeLineScores.length > 0 ? homeLineScores : [homeScore],
    players: homePlayers,
    totals: homeTotals,
  };

  const winner = homeScore >= awayScore ? 'home' : 'away';
  const isOvertime = (awayLineScores.length > 4 && sourceType === 'nba') || (awayLineScores.length > 2 && sourceType === 'cbb');

  return {
    id,
    sourceUrl: url,
    sourceType,
    date: gameDate || new Date().toISOString().split('T')[0],
    formattedDate: formattedDate || gameDate || 'Unknown Date',
    arena: arena || undefined,
    attendance: attendance ? Number(attendance) || attendance : undefined,
    awayTeam,
    homeTeam,
    winner,
    isOvertime,
    submittedAt: new Date().toISOString(),
  };
}

function parsePlayerTable($: cheerio.CheerioAPI, $table: any): { players: PlayerStats[]; totals?: TeamTotals } {
  const players: PlayerStats[] = [];
  const seenPlayerNames = new Set<string>();
  let totals: TeamTotals | undefined;

  let isStarter = true;

  $table.find('tbody tr').each((_: any, row: any) => {
    const $row = $(row);

    // Skip section header rows like "Reserves"
    if ($row.hasClass('thead') || $row.find('th[colspan]').length > 0) {
      if ($row.text().toLowerCase().includes('reserves') || $row.text().toLowerCase().includes('bench')) {
        isStarter = false;
      }
      return;
    }

    const nameCell = $row.find('th[data-stat="player"], td[data-stat="player"], th[scope="row"]').first();
    const playerName = nameCell.text().trim();

    if (!playerName || playerName.toLowerCase() === 'team totals') return;

    if (playerName.toLowerCase().startsWith('reserves')) {
      isStarter = false;
      return;
    }

    if (seenPlayerNames.has(playerName.toLowerCase())) {
      return;
    }
    seenPlayerNames.add(playerName.toLowerCase());

    // Check for DNP (Did Not Play / Did Not Dress / Not With Team)
    const dnpCell = $row.find('td[data-stat="reason"], td[colspan]');
    const reasonText = dnpCell.length > 0 && dnpCell.attr('colspan') ? dnpCell.text().trim() : undefined;

    if (reasonText && (reasonText.includes('Did Not') || reasonText.includes('Not With') || reasonText.includes('Coach'))) {
      players.push({
        name: playerName,
        starter: isStarter,
        fg: 0,
        fga: 0,
        fgPct: null,
        fg3: 0,
        fg3a: 0,
        fg3Pct: null,
        ft: 0,
        fta: 0,
        ftPct: null,
        orb: 0,
        drb: 0,
        trb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        pf: 0,
        pts: 0,
        dnpReason: reasonText,
      });
      return;
    }

    const getStat = (statName: string): number => {
      const cell = $row.find(`td[data-stat="${statName}"]`);
      return parseNumber(cell.text(), 0);
    };

    const getPct = (statName: string): number | null => {
      const cell = $row.find(`td[data-stat="${statName}"]`);
      return parseNullableNumber(cell.text());
    };

    const mp = $row.find('td[data-stat="mp"]').text().trim() || undefined;
    const fg = getStat('fg');
    const fga = getStat('fga');
    const fgPct = getPct('fg_pct');
    const fg3 = getStat('fg3');
    const fg3a = getStat('fg3a');
    const fg3Pct = getPct('fg3_pct');
    const ft = getStat('ft');
    const fta = getStat('fta');
    const ftPct = getPct('ft_pct');
    const orb = getStat('orb');
    const drb = getStat('drb');
    const trb = getStat('trb') || (orb + drb);
    const ast = getStat('ast');
    const stl = getStat('stl');
    const blk = getStat('blk');
    const tov = getStat('tov');
    const pf = getStat('pf');
    const pts = getStat('pts');
    const plusMinusCell = $row.find('td[data-stat="plus_minus"]').text().trim();
    const plusMinus = plusMinusCell !== '' ? parseNullableNumber(plusMinusCell) : null;

    players.push({
      name: playerName,
      starter: isStarter,
      mp,
      fg,
      fga,
      fgPct,
      fg3,
      fg3a,
      fg3Pct,
      ft,
      fta,
      ftPct,
      orb,
      drb,
      trb,
      ast,
      stl,
      blk,
      tov,
      pf,
      pts,
      plusMinus,
    });
  });

  // Table footer totals (tfoot)
  const tfootRow = $table.find('tfoot tr').last();
  if (tfootRow.length > 0) {
    const getFootStat = (statName: string): number => {
      return parseNumber(tfootRow.find(`td[data-stat="${statName}"]`).text(), 0);
    };
    const getFootPct = (statName: string): number | null => {
      return parseNullableNumber(tfootRow.find(`td[data-stat="${statName}"]`).text());
    };

    const fg = getFootStat('fg');
    const fga = getFootStat('fga');
    const fg3 = getFootStat('fg3');
    const fg3a = getFootStat('fg3a');
    const ft = getFootStat('ft');
    const fta = getFootStat('fta');
    const orb = getFootStat('orb');
    const drb = getFootStat('drb');
    const trb = getFootStat('trb') || (orb + drb);
    const ast = getFootStat('ast');
    const stl = getFootStat('stl');
    const blk = getFootStat('blk');
    const tov = getFootStat('tov');
    const pf = getFootStat('pf');
    const pts = getFootStat('pts');

    totals = {
      mp: tfootRow.find('td[data-stat="mp"]').text().trim() || '240',
      fg,
      fga,
      fgPct: getFootPct('fg_pct') ?? (fga > 0 ? Number((fg / fga).toFixed(3)) : null),
      fg3,
      fg3a,
      fg3Pct: getFootPct('fg3_pct') ?? (fg3a > 0 ? Number((fg3 / fg3a).toFixed(3)) : null),
      ft,
      fta,
      ftPct: getFootPct('ft_pct') ?? (fta > 0 ? Number((ft / fta).toFixed(3)) : null),
      orb,
      drb,
      trb,
      ast,
      stl,
      blk,
      tov,
      pf,
      pts,
    };
  }

  return { players, totals };
}

function extractTeamCode(teamName: string): string {
  if (!teamName) return '';
  const clean = teamName.trim();
  const map: Record<string, string> = {
    'Atlanta Hawks': 'ATL',
    'Boston Celtics': 'BOS',
    'Brooklyn Nets': 'BKN',
    'Charlotte Hornets': 'CHA',
    'Chicago Bulls': 'CHI',
    'Cleveland Cavaliers': 'CLE',
    'Dallas Mavericks': 'DAL',
    'Denver Nuggets': 'DEN',
    'Detroit Pistons': 'DET',
    'Golden State Warriors': 'GSW',
    'Houston Rockets': 'HOU',
    'Indiana Pacers': 'IND',
    'LA Clippers': 'LAC',
    'Los Angeles Clippers': 'LAC',
    'Los Angeles Lakers': 'LAL',
    'Memphis Grizzlies': 'MEM',
    'Miami Heat': 'MIA',
    'Milwaukee Bucks': 'MIL',
    'Minnesota Timberwolves': 'MIN',
    'New Orleans Pelicans': 'NOP',
    'New York Knicks': 'NYK',
    'Oklahoma City Thunder': 'OKC',
    'Orlando Magic': 'ORL',
    'Philadelphia 76ers': 'PHI',
    'Phoenix Suns': 'PHX',
    'Portland Trail Blazers': 'POR',
    'Sacramento Kings': 'SAC',
    'San Antonio Spurs': 'SAS',
    'Toronto Raptors': 'TOR',
    'Utah Jazz': 'UTA',
    'Washington Wizards': 'WAS',
  };

  if (map[clean]) return map[clean];

  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
  }
  return clean.slice(0, 3).toUpperCase();
}

const KNOWN_ARENAS: Record<string, string> = {
  // Louisiana & Regional NCAA CBB
  'louisiana state': 'Pete Maravich Assembly Center (Baton Rouge, LA)',
  'louisiana state university': 'Pete Maravich Assembly Center (Baton Rouge, LA)',
  'lsu': 'Pete Maravich Assembly Center (Baton Rouge, LA)',
  'louisiana-state': 'Pete Maravich Assembly Center (Baton Rouge, LA)',
  'new orleans': 'Lakefront Arena (New Orleans, LA)',
  'uno': 'Lakefront Arena (New Orleans, LA)',
  'tulane': 'Devlin Fieldhouse (New Orleans, LA)',
  'louisiana-monroe': 'Fant-Ewing Coliseum (Monroe, LA)',
  'louisiana–monroe': 'Fant-Ewing Coliseum (Monroe, LA)',
  'ulm': 'Fant-Ewing Coliseum (Monroe, LA)',
  'louisiana': 'Cajundome (Lafayette, LA)',
  'louisiana-lafayette': 'Cajundome (Lafayette, LA)',
  'ull': 'Cajundome (Lafayette, LA)',
  'louisiana tech': 'Thomas Assembly Center (Ruston, LA)',
  'latech': 'Thomas Assembly Center (Ruston, LA)',
  'southern': 'F. G. Clark Center (Baton Rouge, LA)',
  'southern university': 'F. G. Clark Center (Baton Rouge, LA)',
  'grambling': 'Fredrick C. Hobdy Assembly Center (Grambling, LA)',
  'grambling state': 'Fredrick C. Hobdy Assembly Center (Grambling, LA)',
  'mcneese': 'The Legacy Center (Lake Charles, LA)',
  'mcneese state': 'The Legacy Center (Lake Charles, LA)',
  'nicholls': 'Stopher Gymnasium (Thibodaux, LA)',
  'nicholls state': 'Stopher Gymnasium (Thibodaux, LA)',
  'northwestern state': 'Prather Coliseum (Natchitoches, LA)',
  'southeastern louisiana': 'University Center (Hammond, LA)',

  // Major NCAA CBB Programs
  'kentucky': 'Rupp Arena (Lexington, KY)',
  'duke': 'Cameron Indoor Stadium (Durham, NC)',
  'north carolina': 'Dean E. Smith Center (Chapel Hill, NC)',
  'unc': 'Dean E. Smith Center (Chapel Hill, NC)',
  'kansas': 'Allen Fieldhouse (Lawrence, KS)',
  'alabama': 'Coleman Coliseum (Tuscaloosa, AL)',
  'auburn': 'Neville Arena (Auburn, AL)',
  'tennessee': 'Thompson-Boling Arena (Knoxville, TN)',
  'florida': 'Exactech Arena at Stephen C. O\'Connell Center (Gainesville, FL)',
  'arkansas': 'Bud Walton Arena (Fayetteville, AR)',
  'texas': 'Moody Center (Austin, TX)',
  'texas a&m': 'Reed Arena (College Station, TX)',
  'houston': 'Fertitta Center (Houston, TX)',
  'baylor': 'Foster Pavilion (Waco, TX)',
  'uconn': 'Harry A. Gampel Pavilion (Storrs, CT)',
  'connecticut': 'Harry A. Gampel Pavilion (Storrs, CT)',
  'purdue': 'Mackey Arena (West Lafayette, IN)',
  'indiana': 'Simon Skjodt Assembly Hall (Bloomington, IN)',
  'illinois': 'State Farm Center (Champaign, IL)',
  'michigan state': 'Breslin Student Events Center (East Lansing, MI)',
  'michigan': 'Crisler Center (Ann Arbor, MI)',
  'ohio state': 'Value City Arena (Columbus, OH)',
  'arizona': 'McKale Center (Tucson, AZ)',
  'ucla': 'Pauley Pavilion (Los Angeles, CA)',
  'gonzaga': 'McCarthey Athletic Center (Spokane, WA)',
  'villanova': 'Finneran Pavilion (Villanova, PA)',
  'marquette': 'Fiserv Forum (Milwaukee, WI)',
  'creighton': 'CHI Health Center (Omaha, NE)',
  'memphis': 'FedExForum (Memphis, TN)',
  'iowa state': 'Hilton Coliseum (Ames, IA)',
  'texas tech': 'United Supermarkets Arena (Lubbock, TX)',

  // NBA Teams
  'new orleans pelicans': 'Smoothie King Center, New Orleans, Louisiana',
  'pelicans': 'Smoothie King Center, New Orleans, Louisiana',
  'nop': 'Smoothie King Center, New Orleans, Louisiana',
  'brooklyn nets': 'Barclays Center, Brooklyn, New York',
  'nets': 'Barclays Center, Brooklyn, New York',
  'chicago bulls': 'United Center, Chicago, Illinois',
  'bulls': 'United Center, Chicago, Illinois',
  'los angeles lakers': 'Crypto.com Arena, Los Angeles, California',
  'lakers': 'Crypto.com Arena, Los Angeles, California',
  'boston celtics': 'TD Garden, Boston, Massachusetts',
  'celtics': 'TD Garden, Boston, Massachusetts',
  'golden state warriors': 'Chase Center, San Francisco, California',
  'warriors': 'Chase Center, San Francisco, California',
  'new york knicks': 'Madison Square Garden, New York, New York',
  'knicks': 'Madison Square Garden, New York, New York',
  'miami heat': 'Kaseya Center, Miami, Florida',
  'heat': 'Kaseya Center, Miami, Florida',
  'dallas mavericks': 'American Airlines Center, Dallas, Texas',
  'mavericks': 'American Airlines Center, Dallas, Texas',
  'houston rockets': 'Toyota Center, Houston, Texas',
  'rockets': 'Toyota Center, Houston, Texas',
  'san antonio spurs': 'Frost Bank Center, San Antonio, Texas',
  'spurs': 'Frost Bank Center, San Antonio, Texas',
  'atlanta hawks': 'State Farm Arena, Atlanta, Georgia',
  'hawks': 'State Farm Arena, Atlanta, Georgia',
  'memphis grizzlies': 'FedExForum, Memphis, Tennessee',
  'grizzlies': 'FedExForum, Memphis, Tennessee',
};

function resolveFallbackArena(homeTeamName?: string, url?: string): string | undefined {
  if (homeTeamName) {
    const clean = homeTeamName.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
    if (KNOWN_ARENAS[clean]) return KNOWN_ARENAS[clean];
    for (const [key, venue] of Object.entries(KNOWN_ARENAS)) {
      if (clean === key || clean.includes(key) || key.includes(clean)) {
        return venue;
      }
    }
  }

  if (url) {
    const urlLower = url.toLowerCase();
    for (const [key, venue] of Object.entries(KNOWN_ARENAS)) {
      if (urlLower.includes(key)) {
        return venue;
      }
    }
  }

  return undefined;
}
