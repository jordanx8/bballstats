# Spec Delta

## ADDED Requirements

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
