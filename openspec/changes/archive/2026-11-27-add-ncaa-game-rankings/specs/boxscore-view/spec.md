# Spec Delta

## ADDED Requirements

### Requirement: Box score header shows game-day rank
The box score page header SHALL show a ranked team's stored game-day rank right before its name, as "#" followed by the number (for example "#17 Kentucky"). A team with no stored rank SHALL show its name with no rank marker, placeholder, or "NR".

#### Scenario: Ranked visitor
- **WHEN** the user opens the box score for the 2024-02-21 Kentucky @ LSU game
- **THEN** the header shows "#17 Kentucky" and "LSU" with no rank marker

#### Scenario: No ranks stored
- **WHEN** the user opens the box score for an NCAA game with no stored ranks, or for any NBA or WNBA game
- **THEN** the header shows both team names with no rank marker
