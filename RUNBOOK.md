# Mood Bot Runbook (MVP)

## Prereqs
- Bun installed.
- `.env` with `MOOD=<bot_token>` and optional `DB_PATH` (defaults to `./mood.sqlite`).

## First-time setup
1) `bun install`
2) `bun run src/scripts/import.ts --url https://raw.githubusercontent.com/dancingteeth/aisyncday_vibe/refs/heads/main/participants_mocked.json`
   - For local file: `bun run src/scripts/import.ts --file ./participants_mocked.json`
   - Flags accept either space or equals forms, e.g., `--url <url>` or `--url=<url>`.

## Start / stop
- Start bot (long polling): `bun start`
- Stop: Ctrl+C

## Notes
- SQLite file lives at `DB_PATH`; ensure write perms and backups as needed.
- Users without Telegram usernames are prompted to set one; interactions are blocked until set.
- Status: colors green/yellow/red/grey (default grey), optional text up to 120 chars.
- Arrays (skills, looking_for, etc.) are comma-separated input; trimmed/deduped, max 7 items.

