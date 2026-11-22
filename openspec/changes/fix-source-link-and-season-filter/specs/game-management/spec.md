# Spec Delta

## Purpose

Manually run GitHub Actions that change the logged game data in the repository and redeploy the static site, since the deployed site itself cannot write data.

## ADDED Requirements

### Requirement: Update a game's notes
The project SHALL provide a manually run GitHub Action that takes a game identifier and new notes text, replaces that game's notes in the stored game data, commits the change, and redeploys the site.

#### Scenario: Setting notes
- **WHEN** the Action is run with an existing game's ID and the notes "RJ Luis debut"
- **THEN** that game's stored notes become "RJ Luis debut", the change is committed, and the redeployed site shows the new notes

#### Scenario: Game identified by source URL
- **WHEN** the Action is run with a game's exact source URL instead of its ID
- **THEN** that game's notes are updated the same way

### Requirement: Clear a game's notes
The Action SHALL let the user remove a game's notes by an explicit clear option, and SHALL refuse a run that provides neither notes text nor the clear option.

#### Scenario: Clearing notes
- **WHEN** the Action is run with a game's ID and the clear option set
- **THEN** that game's stored notes are removed and the site is redeployed

#### Scenario: Nothing to change
- **WHEN** the Action is run with a game's ID, empty notes, and the clear option not set
- **THEN** the run fails with a message saying to provide notes or choose clear, and no data is changed

### Requirement: Only an exact game match is updated
The Action SHALL update a game only when the identifier exactly matches one game's ID or source URL (ignoring letter case), and SHALL change nothing otherwise.

#### Scenario: No matching game
- **WHEN** the Action is run with an identifier that matches no game exactly
- **THEN** the run fails with a not-found message and no data is changed

#### Scenario: Partial ID is not enough
- **WHEN** the Action is run with only part of a game's ID
- **THEN** the run fails with a not-found message rather than updating a game whose ID contains it

### Requirement: Notes text is stored exactly as entered
The Action SHALL store the notes text exactly as entered, including quotes, dollar signs, backticks, and other shell-special characters, and SHALL never run any part of the notes as a command.

#### Scenario: Special characters in notes
- **WHEN** the Action is run with the notes ``Zion's "dunk" $$ `ls` ``
- **THEN** the stored notes are exactly that text and no command is executed

### Requirement: Unchanged notes make no commit
If the new notes equal the game's current notes, the Action SHALL succeed without creating a commit.

#### Scenario: Same notes again
- **WHEN** the Action is run with notes identical to what the game already has
- **THEN** the run succeeds and no new commit is made
