# boxscore-scraping Specification

## Purpose

Turns a supported Basketball-Reference or Sports-Reference box score page into a stored game record, including the game's league, ID, final scores, per-period line scores, and player stats.

## Requirements

### Requirement: Women's college league detected from the URL
When scraping a Sports-Reference college box score, the scraper SHALL classify the game as NCAA Women if the URL's file name ends in `_w.html`, and as NCAA Men otherwise.

#### Scenario: Women's box score URL
- **WHEN** the scraper is given `https://www.sports-reference.com/cbb/boxscores/2025-12-13-18-louisiana-state_w.html`
- **THEN** the stored game's league is NCAA Women

#### Scenario: Men's box score URL
- **WHEN** the scraper is given `https://www.sports-reference.com/cbb/boxscores/2024-11-06-20-louisiana-state.html`
- **THEN** the stored game's league is NCAA Men

### Requirement: College game IDs do not depend on gender
The scraper SHALL build college game IDs the same way for men's and women's games (the `cbb-` prefix followed by the box score's file name), so re-scraping a game keeps its ID.

#### Scenario: Re-scraping the existing women's game
- **WHEN** the existing women's game's URL is scraped again
- **THEN** the resulting game ID is `cbb-2025-12-13-18-louisiana-state_w` and it replaces the existing record rather than adding a duplicate

### Requirement: Per-period line scores when the page provides them
The scraper SHALL store one score per period for each team whenever the box score page lists per-period scores, for every league including NCAA Women. When the page lists only final scores, each team's line scores SHALL be a single entry equal to its final score.

#### Scenario: Page lists quarters
- **WHEN** the scraper is given a women's college box score whose line score lists four quarters
- **THEN** each team's stored line scores have four entries that add up to its final score

#### Scenario: Page lists only totals
- **WHEN** the scraper is given the women's box score for 2025-12-13 (LSU Women vs. Louisiana Tech Women), whose line score lists only final scores
- **THEN** each team's line scores are a single entry equal to its final score (87 and 61)

### Requirement: Women's college team names are marked
The scraper SHALL append " Women" to both team names of an NCAA Women game, unless the name already ends with "Women", so women's teams never share a name with the same school's men's team.

#### Scenario: Scraping a women's game
- **WHEN** the scraper is given the women's box score for 2025-12-13
- **THEN** the teams are named "LSU Women" and "Louisiana Tech Women"

#### Scenario: Men's names unchanged
- **WHEN** the scraper is given a men's college box score
- **THEN** team names are stored as the page gives them, without " Women"

### Requirement: NCAA games record each team's game-day AP rank
When an NCAA Men or NCAA Women game is added or re-scraped, the system SHALL store, for each team, its AP Top 25 rank as of that game, taken from ESPN's record of the same game. A team ranked 1 through 25 SHALL have that number stored. An unranked team SHALL have no rank stored.

#### Scenario: Ranked visitor
- **WHEN** the 2024-02-21 Kentucky @ LSU men's game is added
- **THEN** Kentucky's stored rank is 17 and LSU has no stored rank

#### Scenario: Neither team ranked
- **WHEN** the 2026-01-14 Kentucky @ LSU men's game is added
- **THEN** neither team has a stored rank

#### Scenario: Women's college game
- **WHEN** an NCAA Women game is added and ESPN lists a team as ranked for that game
- **THEN** that team's game-day rank is stored the same way as for men's games

### Requirement: Rank lookup never blocks saving a game
If the rank lookup fails (ESPN can't be reached, returns an error, or has no game matching the date and final score), the system SHALL still save the game with all its other data, with no rank stored for either team, and SHALL report that no rank was found.

#### Scenario: ESPN unreachable
- **WHEN** an NCAA game is added while ESPN cannot be reached
- **THEN** the game is saved with its scores and box score, without ranks, and the run reports that ranks were not found

#### Scenario: No matching ESPN game
- **WHEN** an NCAA game is added and ESPN has no game with the same date and final score
- **THEN** the game is saved without ranks

### Requirement: Professional games have no rank
NBA and WNBA games SHALL NOT have a rank stored for either team, and adding them SHALL NOT look up rankings.

#### Scenario: Adding an NBA game
- **WHEN** an NBA game is added
- **THEN** neither team has a stored rank

### Requirement: Existing NCAA games can be backfilled with ranks
The project SHALL provide a command that adds game-day ranks to NCAA games already stored. By default it SHALL skip games already matched to ESPN, and with a force option it SHALL look them all up again. It SHALL change nothing but ranks and SHALL list the games it could not match.

#### Scenario: First backfill
- **WHEN** the backfill runs over stored NCAA games that have never been matched to ESPN
- **THEN** each matched game gets its teams' game-day ranks, NBA and WNBA games are untouched, and unmatched games are listed

#### Scenario: Running it again
- **WHEN** the backfill runs a second time without the force option
- **THEN** games already matched are not looked up again, and if no previously unmatched game matches now, the data file is unchanged

#### Scenario: Other data untouched
- **WHEN** the backfill updates a game
- **THEN** that game's scores, players, notes, and ID are exactly as before
