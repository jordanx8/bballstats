# Spec Delta

## ADDED Requirements

### Requirement: Scrape Action accepts an optional game type
The single-game "Scrape Game & Deploy" Action SHALL offer an optional Game type dropdown with the choices none (the default), preseason, exhibition, and playoff. When preseason, exhibition, or playoff is chosen, the scraped game SHALL be stored with that game type. When none is chosen, a newly added game SHALL be stored with no game type.

#### Scenario: Importing a playoff game
- **WHEN** the user runs the Action with a playoff box score URL and Game type set to playoff
- **THEN** the stored game has game type playoff and shows the "PLAYOFFS" badge once the site redeploys

#### Scenario: Leaving the default
- **WHEN** the user runs the Action for a new game and leaves Game type as none
- **THEN** the stored game has no game type and shows no game-type badge

### Requirement: Re-scraping keeps an existing game type
When a game that already has a game type is scraped again with Game type left as none, the system SHALL keep the existing game type. When a type is chosen, the chosen type SHALL replace the existing one.

#### Scenario: Re-scrape without choosing a type
- **WHEN** the 2024-04-29 Thunder @ Pelicans playoff game is scraped again with Game type left as none
- **THEN** the game still has game type playoff

#### Scenario: Re-scrape with a different type
- **WHEN** a game marked exhibition is scraped again with Game type set to preseason
- **THEN** the game's type is preseason

### Requirement: Scrape Action inputs are never run as commands
The single-game scrape Action SHALL pass its box score URL, notes, and game type to the scrape step as data, never as part of a shell command. Notes SHALL be stored exactly as entered, including quotes, dollar signs, backticks, and other shell-special characters. The scrape step SHALL reject any game type other than the allowed values without changing any data.

#### Scenario: Notes with shell-special characters
- **WHEN** the user runs the Action with notes containing a double quote, `$(whoami)`, a backtick-wrapped command, and a `%` sign
- **THEN** the stored notes are exactly the text entered, and no part of it runs as a command

#### Scenario: Unexpected value
- **WHEN** the scrape script is given a game type other than preseason, exhibition, or playoff (for example "finals")
- **THEN** the script exits with an error naming the allowed values and `data/games.json` is unchanged
