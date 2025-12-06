# Mood Bot Specification (Telegram-only MVP)

Mood is a Telegram-only “traffic light” availability bot for event attendees. It lets users set a simple color status (green/yellow/red, default grey), optionally add a short text status, view/edit their profile (seeded from event data when available), and browse others with basic filters. It runs on Bun + TypeScript with SQLite, uses the Telegram Bot API via long polling, and relies on a lightweight schema derived from the provided participants data.

This spec consolidates all agreed decisions. Another agent should be able to implement the Telegram bot using this document and the linked references.

**Logging requirement:** Any AI agent working from this spec must maintain `VIBE_LOG.md` with the same principles used here: log every user prompt in full, add assistant replies (full if short; summarized if long), include timestamps, roles, and brief tags, and update after each exchange.

**Logging format (for `VIBE_LOG.md`):**
- Group entries by day with `## YYYY-MM-DD`.
- Each message block:
  - Heading `### HH:MM UTC`
  - Line with `**User**` or `**Assistant**`
  - The message text (user prompt in full; assistant reply in full if <~1000 chars, otherwise a concise summary)
  - A tags line: `- Tags: [tag1, tag2]`
- Blank lines between blocks for readability.

## References
- Starter repo: https://github.com/dancingteeth/aisyncday_vibe
- Data source: https://raw.githubusercontent.com/dancingteeth/aisyncday_vibe/refs/heads/main/participants_mocked.json
- Telegram Bot API docs: https://core.telegram.org/bots
- Bot address: https://t.me/eventmood_bot

## Tech Stack & Hosting
- Runtime: Bun + TypeScript.
- Libraries: node-telegram-bot-api, sqlite3, dotenv.
- Delivery: long polling (not webhooks).
- Hosting: VPS.
- Persistence: SQLite file in project folder.

## Secrets / Environment
- Bot token comes from env var `MOOD` (or `.env` file).

## Data Import & Claim Flow
- Before first launch, import `participants_mocked.json` into SQLite.
- On first user message:
  - Match by Telegram username. If found, load that profile for editing.
  - If not found, create a new record with status color = `grey`, status text empty.
- Username requirement: if the user has no Telegram username, prompt them to set one before proceeding (default stance).

## Status Model
- Color options: green (open), yellow (conditional), red (do not disturb), grey (default/not set).
- Defaults: color = grey on first launch; text status empty until user sets it.
- No auto-expiry/TTL in MVP.

## Commands
- `/start` → main menu.
- `/status` → status screen.
- `/profile` → profile view.
- `/search` → search people.
- `/help` → help.
- `/update` (internal use from profile) → profile update flow.

## UX Flows (draft; revisit after first build)
- /start: Greeting + purpose; list options with inline buttons. Show current status in parentheses; profile option notes if not filled yet; search option includes a short example. Buttons: Set Status, Browse/Search, My Profile, Help/About.
- /status: Show current color/text (default grey “Not set”, text empty). Inline buttons with traffic-light emojis for Green/Yellow/Red + Back. Tapping updates status and refreshes message. Text replies set text status and refresh.
- /profile: Show all profile fields (including unset). Inline buttons: “Update info” (calls `/update`), “Back to main menu” (`/start`).
- /update: Field picker (inline buttons). Scalars prompt shows current value. Arrays: comma-separated input; removal via ❌ buttons. Controls: Back to profile, Cancel, optional Review & save. Validation below.
- /search: Filters by status (Green only; Green+Yellow sorted Green first; Everyone sorted Green, Yellow, Grey, Red). Optional text query for name/role/skills/looking_for. Results paginated with Next/Prev + Back to menu. Each card: name, status (emoji), last updated, key tags (skills/looking_for).

## Validation (defaults)
- name, role/title ≤ 80 chars; bio ≤ 300; text status ≤ 120.
- Arrays: trim, dedupe, drop empties; max 7 items; comma-separated input accepted.
- Basic URL formatting for links; otherwise minimal validation.

## Error Handling & Logging
- MVP user copy stays simple; log all errors with context: user id, username, action, payload.

## Organizer / Visibility Flags
- Expose flags to developers (e.g., show/hide Not set, include Red in search). Current defaults: hide Not set from lists by down-ranking; include Red but deprioritize.

## Schema (SQLite, current draft)
Profile fields are all columns up to `custom_1`. `custom_1` stores status color (init “grey”). `custom_2` stores status text (unset until user sets it). Arrays stored as JSON text.

```sql
CREATE TABLE IF NOT EXISTS participants (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  telegram            TEXT UNIQUE,
  linkedin            TEXT,
  email               TEXT,
  photo               TEXT,
  bio                 TEXT,
  skills              TEXT,
  has_startup         INTEGER,
  startup_stage       TEXT,
  startup_name        TEXT,
  startup_description TEXT,
  looking_for         TEXT,
  can_help            TEXT,
  needs_help          TEXT,
  ai_usage            TEXT,
  custom_1            TEXT,
  custom_2            TEXT,
  custom_3            TEXT,
  custom_4            TEXT,
  custom_5            TEXT,
  custom_6            TEXT,
  custom_7            TEXT,
  custom_array_1      TEXT,
  custom_array_2      TEXT,
  custom_array_3      TEXT,
  custom_array_4      TEXT,
  custom_array_5      TEXT,
  custom_array_6      TEXT,
  custom_array_7      TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_participants_updated_at
AFTER UPDATE ON participants
FOR EACH ROW
BEGIN
  UPDATE participants SET updated_at = datetime('now') WHERE id = OLD.id;
END;
```

