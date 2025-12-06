import path from "path";
import sqlite3 from "sqlite3";

sqlite3.verbose();

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "mood.sqlite");

export const db = new sqlite3.Database(DB_PATH);

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

export const database = { run, get, all };

export async function initSchema(): Promise<void> {
  await run(
    `
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
`
  );

  await run(
    `
CREATE TRIGGER IF NOT EXISTS trg_participants_updated_at
AFTER UPDATE ON participants
FOR EACH ROW
BEGIN
  UPDATE participants SET updated_at = datetime('now') WHERE id = OLD.id;
END;
`
  );
}

