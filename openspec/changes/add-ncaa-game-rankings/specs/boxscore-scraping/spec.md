# Spec Delta

## ADDED Requirements

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
