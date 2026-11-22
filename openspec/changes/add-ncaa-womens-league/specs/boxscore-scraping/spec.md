# Spec Delta

## Purpose

Turns a supported Basketball-Reference or Sports-Reference box score page into a stored game record, including the game's league, ID, final scores, per-period line scores, and player stats.

## ADDED Requirements

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
