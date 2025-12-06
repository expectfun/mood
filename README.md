# Mood Bot (Telegram)

Telegram-only “traffic light” availability bot for event attendees. Built with Bun + TypeScript, SQLite, and node-telegram-bot-api. See `spec.md` for product decisions.

## Quick start
1) Install Bun and dependencies: `bun install`
2) Copy `env.example` to `.env` and set `MOOD` (bot token) and `DB_PATH` if desired.
3) Seed participants (before first launch): `bun run src/scripts/import.ts --url https://raw.githubusercontent.com/dancingteeth/aisyncday_vibe/refs/heads/main/participants_mocked.json`
4) Start bot (long polling): `bun start`

## Scripts
- `bun start` – run bot with long polling.
- `bun run src/scripts/import.ts --file ./participants_mocked.json` – import from local file (idempotent on telegram username).
- `bun run src/scripts/import.ts --url <url>` – import from remote JSON. (Also accepts `--url=<url>` and `--file=<path>`.)

## Notes
- SQLite file defaults to `mood.sqlite` in project root.
- Requires Telegram username; users without one are prompted to set it.
- Status colors: green/yellow/red/grey (default grey). Text status optional (≤120 chars).

