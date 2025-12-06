# Implementation Plan for Mood Bot (Telegram, Bun + TypeScript)

- **Objectives**
  - Telegram-only “traffic light” availability bot; statuses: green/yellow/red/grey (default grey), optional short text. Provide profile view/edit and basic browse/search with filters per spec.

- **Environment & Setup**
  - Runtime: Bun + TypeScript; deps: `node-telegram-bot-api`, `sqlite3`, `dotenv`.
  - Load `MOOD` bot token from env/.env; fail fast if missing.
  - Structure: `src/` with `bot.ts` entry, `db.ts`, `repository.ts`, `services/`, `handlers/`, `views/`, `types/`, `logging.ts`.

- **Database**
  - SQLite file in project root.
  - Create `participants` table + `trg_participants_updated_at` trigger exactly as spec; store arrays as JSON text.
  - Seed status defaults: `custom_1` = "grey"; `custom_2` empty.

- **Data Import**
  - One-time importer to load `participants_mocked.json` into SQLite before first launch (idempotent; skip on existing `telegram`).

- **Bot Wiring**
  - Use long polling via `node-telegram-bot-api`.
  - Central update router: commands (/start, /status, /profile, /search, /update, /help) + fallback text for status text/input prompts.
  - Middleware: load/create user record by Telegram username; if username missing, prompt to set one and short-circuit other flows.

- **Session / State**
  - Lightweight in-memory state keyed by chat id for current flow (e.g., pending field update, search pagination filters).
  - Persist only profile data in DB; state resets on restart (acceptable for MVP).

- **UI Components**
  - Inline keyboards for main menu, status colors, profile actions, search pagination/filter toggles.
  - Message rendering helpers for status view, profile view, search cards.

- **Command Flows**
  - `/start`: greeting, show current status (emoji + text), buttons: Set Status, Browse/Search, My Profile, Help/About.
  - `/status`: show current color/text; inline buttons for Green/Yellow/Red + Back; text input sets status text then re-render.
  - `/profile`: render all fields (including unset); buttons: Update info (/update), Back (/start).
  - `/update`: field picker; prompt for scalar values; arrays via comma-separated input with trim/dedupe/max 7; allow Cancel/Back; apply validation before saving.
  - `/search`: filters: Green only; Green+Yellow (Green first); Everyone (Green, Yellow, Grey, Red order). Optional text query over name/role/skills/looking_for. Paginate with Next/Prev; include Back to menu.
  - `/help`: brief instructions + contact note.

- **Status Handling**
  - Default grey until set. Text status ≤120 chars.
  - Status buttons update `custom_1`; free text updates `custom_2`; re-render status screen after each change.

- **Profile Editing**
  - Fields per schema (name, role/title, bio, links, arrays for skills/looking_for/etc.).
  - Validation: name/role ≤80 chars; bio ≤300; arrays trimmed/deduped, max 7; basic URL formatting for links; minimal otherwise.

- **Search Implementation**
  - Query builder with filters/order: Green first, then Yellow, Grey, Red (hide/soft-rank Not set as per default).
  - Optional text query matches name/role/skills/looking_for (case-insensitive substring).
  - Pagination (e.g., 5 per page) with inline buttons; include last updated timestamp in cards.

- **Logging & Errors**
  - Central error handler logs context: user id, username, action, payload. User copy remains simple.
  - Maintain `VIBE_LOG.md` per spec (timestamps UTC, role-tagged, summarize long replies).

- **Testing / QA**
  - Add `npm`/`bun` scripts for lint/build/start.
  - Manual checks: startup without env → fails clearly; first message without username → prompt; status set/update; profile edit validation; search pagination; long polling resilience (restart).

- **Deployment / Ops**
  - Bun start script for VPS; ensure SQLite file write perms and backup strategy.
  - .env template example with `MOOD=`.
  - Basic runbook: start/stop commands, log locations, seed procedure.

- **Next Iterations (post-MVP)**
  - Persistent session state, richer search filters, organizer visibility flags tuning, analytics, and TTL/auto-expiry for statuses.

