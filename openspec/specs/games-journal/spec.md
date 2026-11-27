# games-journal Specification

## Purpose

The chronological journal of every attended game, with search, league and season filters, and sort options for finding a game.

## Requirements

### Requirement: Season filter applies immediately
The games journal SHALL update its list of games as soon as the Season filter changes, showing only games from the selected season, with no other control needing to change.

#### Scenario: Selecting a season
- **WHEN** the user picks a season from the Season filter and changes nothing else
- **THEN** the list immediately shows only games from that season

#### Scenario: Returning to all seasons
- **WHEN** the user switches the Season filter back to all seasons
- **THEN** the list immediately shows games from every season again

#### Scenario: Season combined with other filters
- **WHEN** a league filter or search is already active and the user then changes the season
- **THEN** the list shows only games matching the league filter, the search, and the new season together

### Requirement: Game rows show game-day rank
Each game in the games journal SHALL show a ranked team's stored game-day rank right before that team's name, as "#" followed by the number (for example "#20 LSU"). A team with no stored rank SHALL show its name with no rank marker, placeholder, or "NR".

#### Scenario: Ranked team in the list
- **WHEN** the games journal lists the 2023-01-21 Tennessee @ LSU game
- **THEN** the row shows "#9 Tennessee" and "LSU" with no rank marker

#### Scenario: Unranked and professional games
- **WHEN** the games journal lists an NCAA game with no stored ranks, or any NBA or WNBA game
- **THEN** the row shows both team names with no rank marker

#### Scenario: Search unaffected by rank
- **WHEN** the user searches the journal for a team name such as "Kentucky"
- **THEN** games involving that team are found whether or not it was ranked in them

### Requirement: Game rows show each team's post-game record
Each game in the games journal SHALL show each team's stored record (its record after that game) right after the team's name, exactly as stored, for every game, including preseason and exhibition games and records of 0-0. A team with no stored record SHALL show its name with nothing after it.

#### Scenario: Regular-season game
- **WHEN** the games journal lists the 2024-02-21 Kentucky @ LSU game
- **THEN** the row shows "#17 Kentucky" followed by "18-8", and "LSU" followed by "14-12"

#### Scenario: Exhibition with 0-0 records
- **WHEN** the games journal lists the 2026-10-14 UCF Knights @ LSU exhibition
- **THEN** both teams show "0-0" after their names

#### Scenario: Preseason records
- **WHEN** the games journal lists the 2026-10-16 Washington Wizards @ New Orleans Pelicans preseason game
- **THEN** the Wizards show "2-2" and the Pelicans show "3-1"

### Requirement: Game rows show a game-type badge
A game marked as preseason or exhibition SHALL show a separate badge next to its league badge, reading "PRESEASON" or "EXHIBITION" in all capitals, styled like the league badges. A game with no game type SHALL show no such badge.

#### Scenario: Exhibition game
- **WHEN** the games journal lists the 2026-10-14 UCF Knights @ LSU game
- **THEN** the row shows the "NCAA Men" league badge and, separately, an "EXHIBITION" badge

#### Scenario: Preseason game
- **WHEN** the games journal lists the 2026-10-16 Washington Wizards @ New Orleans Pelicans game
- **THEN** the row shows the "NBA" league badge and, separately, a "PRESEASON" badge

#### Scenario: Regular-season game
- **WHEN** the games journal lists the 2026-11-03 New Orleans @ LSU game
- **THEN** the row shows only its league badge and no game-type badge
