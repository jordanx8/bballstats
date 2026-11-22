# Spec Delta

## Purpose

The chronological journal of every attended game, with search, league and season filters, and sort options for finding a game.

## ADDED Requirements

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
