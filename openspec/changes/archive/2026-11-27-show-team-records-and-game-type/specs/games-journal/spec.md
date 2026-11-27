# Spec Delta

## ADDED Requirements

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
