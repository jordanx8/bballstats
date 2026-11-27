# Spec Delta

## MODIFIED Requirements

### Requirement: Box score header shows a game-type badge
The box score page header SHALL show, for a game marked as preseason, exhibition, or playoff, a separate badge next to the league badge reading "PRESEASON", "EXHIBITION", or "PLAYOFFS" in all capitals, styled like the league badge. A game with no game type SHALL show no such badge. The header's team records SHALL be shown as stored, unaffected by the game type.

#### Scenario: Exhibition box score
- **WHEN** the user opens the box score for the 2026-10-14 UCF Knights @ LSU game
- **THEN** the header shows the "NCAA Men" badge, a separate "EXHIBITION" badge, and both teams' "0-0" records

#### Scenario: Preseason box score
- **WHEN** the user opens the box score for the 2026-10-16 Washington Wizards @ New Orleans Pelicans game
- **THEN** the header shows the "NBA" badge and a separate "PRESEASON" badge

#### Scenario: Playoff box score
- **WHEN** the user opens the box score for the 2022-04-22 Phoenix Suns @ New Orleans Pelicans game
- **THEN** the header shows the "NBA" badge and a separate "PLAYOFFS" badge, with the stored series records "2-1" and "1-2"

#### Scenario: Regular-season box score
- **WHEN** the user opens the box score for any game with no game type
- **THEN** the header shows only the league badge
