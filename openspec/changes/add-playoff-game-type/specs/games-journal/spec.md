# Spec Delta

## MODIFIED Requirements

### Requirement: Game rows show a game-type badge
A game marked as preseason, exhibition, or playoff SHALL show a separate badge next to its league badge, reading "PRESEASON", "EXHIBITION", or "PLAYOFFS" in all capitals, styled like the league badges. A game with no game type SHALL show no such badge.

#### Scenario: Exhibition game
- **WHEN** the games journal lists the 2026-10-14 UCF Knights @ LSU game
- **THEN** the row shows the "NCAA Men" league badge and, separately, an "EXHIBITION" badge

#### Scenario: Preseason game
- **WHEN** the games journal lists the 2026-10-16 Washington Wizards @ New Orleans Pelicans game
- **THEN** the row shows the "NBA" league badge and, separately, a "PRESEASON" badge

#### Scenario: Playoff game
- **WHEN** the games journal lists the 2024-04-29 Oklahoma City Thunder @ New Orleans Pelicans game
- **THEN** the row shows the "NBA" league badge and, separately, a "PLAYOFFS" badge, and the teams' stored series records "4-0" and "0-4" after their names

#### Scenario: Regular-season game
- **WHEN** the games journal lists the 2026-11-03 New Orleans @ LSU game
- **THEN** the row shows only its league badge and no game-type badge
