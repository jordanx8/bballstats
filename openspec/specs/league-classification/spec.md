# league-classification Specification

## Purpose

Defines which league each logged game belongs to (NBA, WNBA, NCAA Men, NCAA Women), how each league's periods and overtime work, how leagues are labeled, and that stats are grouped and filtered by league.

## Requirements

### Requirement: Women's college games are their own league
Every logged game SHALL belong to exactly one league: NBA, WNBA, NCAA Men, or NCAA Women. Women's college games SHALL be NCAA Women, and SHALL NOT be counted as NCAA Men.

#### Scenario: Women's college game
- **WHEN** a logged game is a women's college game
- **THEN** its league is NCAA Women

#### Scenario: Men's college game
- **WHEN** a logged game is a men's college game
- **THEN** its league is NCAA Men

### Requirement: League labels
Leagues SHALL be labeled "NBA", "WNBA", "NCAA Men", and "NCAA Women" wherever a league name is shown, including league filters, game badges, and the box score header.

#### Scenario: Box score header
- **WHEN** the user opens a women's college game's box score
- **THEN** the header names the league as "NCAA Women"

#### Scenario: League filter options
- **WHEN** the user opens any league filter (games journal, players, teams)
- **THEN** "NCAA Men" and "NCAA Women" appear as separate options

### Requirement: Stats are separated by league
Filtering any games, players, or teams list by a league SHALL include only games from that league, so NCAA Men and NCAA Women results never mix.

#### Scenario: Filtering players by NCAA Men
- **WHEN** the user filters the players leaderboard to NCAA Men
- **THEN** no player appears based on a women's college game

#### Scenario: Filtering games by NCAA Women
- **WHEN** the user filters the games journal to NCAA Women
- **THEN** only women's college games are listed

#### Scenario: Season league breakdown
- **WHEN** the user views a season that includes both men's and women's college games
- **THEN** the season's league counts list NCAA Men and NCAA Women separately

### Requirement: Period format per league
NCAA Men games SHALL have two halves, labeled H1 and H2. NBA, WNBA, and NCAA Women games SHALL have four quarters, labeled Q1–Q4. Periods after regulation SHALL be labeled OT1, OT2, and so on.

#### Scenario: Women's college line score
- **WHEN** a women's college game's box score shows four regulation periods
- **THEN** they are labeled Q1, Q2, Q3, Q4

#### Scenario: Women's college overtime period
- **WHEN** a women's college game's box score shows five periods
- **THEN** the fifth is labeled OT1

#### Scenario: Men's college unchanged
- **WHEN** a men's college game's box score shows two regulation periods
- **THEN** they are labeled H1 and H2

### Requirement: Overtime detection per league
A game SHALL be marked as overtime only when it has more periods than its league's regulation (two for NCAA Men, four for NCAA Women, NBA, and WNBA).

#### Scenario: Four-quarter women's game
- **WHEN** a women's college game has exactly four periods
- **THEN** it is not marked as overtime

#### Scenario: Women's game with overtime
- **WHEN** a women's college game has five or more periods
- **THEN** it is marked as overtime

### Requirement: Existing game links keep working
Reclassifying a game's league SHALL NOT change its game ID, so existing links to that game keep working.

#### Scenario: Migrated women's game
- **WHEN** the existing LSU Women vs. Louisiana Tech Women game (2025-12-13) is moved to NCAA Women
- **THEN** its link `#/games/cbb-2025-12-13-18-louisiana-state_w` still opens it
