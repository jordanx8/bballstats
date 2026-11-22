# Spec Delta

## Purpose

The single-game box score page: the scoreboard, line scores, and player tables for one attended game, its personal notes, plus a link back to the page the game's data came from.

## ADDED Requirements

### Requirement: Source link names the linked site
The box score page SHALL show a link to the game's source URL labeled "View on <site>", where <site> is determined from the domain of that URL, not from the game's league.

#### Scenario: Basketball-Reference source
- **WHEN** a game's source URL is on basketball-reference.com (any league, including WNBA)
- **THEN** the link reads "View on Basketball-Reference"

#### Scenario: Sports-Reference source
- **WHEN** a game's source URL is on sports-reference.com
- **THEN** the link reads "View on Sports-Reference"

#### Scenario: ESPN source
- **WHEN** a game's source URL is on espn.com
- **THEN** the link reads "View on ESPN"

#### Scenario: League does not override the site
- **WHEN** an NBA game's source URL is on espn.com
- **THEN** the link reads "View on ESPN", not "View on Basketball-Reference"

#### Scenario: Subdomain of a known site
- **WHEN** a game's source URL host is a subdomain of a known site, such as www.basketball-reference.com
- **THEN** the link uses that known site's friendly name

### Requirement: Unknown sites show their domain
When the source URL's domain is not a known site, the link SHALL name the site by its host, with a leading "www." removed.

#### Scenario: School athletics site
- **WHEN** a game's source URL is https://lsusports.net/boxscore/20986
- **THEN** the link reads "View on lsusports.net"

#### Scenario: Leading www removed
- **WHEN** a game's source URL host is www.example.com
- **THEN** the link reads "View on example.com"

### Requirement: Unparseable source URLs still link
If the source URL cannot be parsed into a host, the page SHALL still show the link, labeled "View source".

#### Scenario: Malformed URL
- **WHEN** a game's source URL is not a valid absolute URL
- **THEN** the link reads "View source" and still points at the stored URL

### Requirement: Notes editing only where it can be saved
The box score page SHALL offer in-place notes editing only when the app can save the change (the local server is running). Otherwise it SHALL NOT show an editor or report notes as saved.

#### Scenario: Local server running
- **WHEN** the box score page is opened with the local server available and the user edits and saves notes
- **THEN** the notes are saved and still shown after a reload

#### Scenario: Deployed static site
- **WHEN** the box score page is opened on the deployed static site
- **THEN** no notes editor or save button is shown

### Requirement: Static site points to the notes Action
On the deployed static site, the notes section SHALL show the game's current notes, the game's ID, and a link that opens the "Update Game Notes" Action on GitHub.

#### Scenario: Following the link
- **WHEN** the user clicks the edit-notes link on the deployed site
- **THEN** the "Update Game Notes" Action page for this repository opens in a new tab

#### Scenario: Copying the game ID
- **WHEN** the user views a game's notes section on the deployed site
- **THEN** the game's ID is shown with a way to copy it for use in the Action
