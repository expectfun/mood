import { database } from "./db.ts";
import { SearchFilters, Participant, StatusColor } from "./types.ts";
import { availabilityOrderExpr, clampText, parseListInput, safeUrl } from "./utils.ts";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function toDbArrays(fields: Partial<Participant>): Record<string, string | number | null> {
  const clone: Record<string, string | number | null> = {};
  if (fields.skills) clone.skills = JSON.stringify(fields.skills);
  if (fields.looking_for) clone.looking_for = JSON.stringify(fields.looking_for);
  if (fields.can_help) clone.can_help = JSON.stringify(fields.can_help);
  if (fields.needs_help) clone.needs_help = JSON.stringify(fields.needs_help);
  if (fields.custom_array_1) clone.custom_array_1 = JSON.stringify(fields.custom_array_1);
  return clone;
}

function mapRow(row: any): Participant {
  return {
    id: row.id,
    name: row.name,
    telegram: row.telegram,
    linkedin: row.linkedin,
    email: row.email,
    photo: row.photo,
    bio: row.bio,
    skills: parseJsonArray(row.skills),
    has_startup: !!row.has_startup,
    startup_stage: row.startup_stage,
    startup_name: row.startup_name,
    startup_description: row.startup_description,
    looking_for: parseJsonArray(row.looking_for),
    can_help: parseJsonArray(row.can_help),
    needs_help: parseJsonArray(row.needs_help),
    ai_usage: row.ai_usage,
    custom_1: (row.custom_1 || "grey") as StatusColor,
    custom_2: row.custom_2,
    custom_array_1: parseJsonArray(row.custom_array_1),
    updated_at: row.updated_at,
  };
}

export async function findByTelegram(username: string): Promise<Participant | null> {
  const row = await database.get<any>(
    "SELECT * FROM participants WHERE telegram = ? LIMIT 1",
    [username]
  );
  return row ? mapRow(row) : null;
}

export async function findById(id: number): Promise<Participant | null> {
  const row = await database.get<any>("SELECT * FROM participants WHERE id = ? LIMIT 1", [id]);
  return row ? mapRow(row) : null;
}

export async function createParticipant(username: string, name: string): Promise<Participant> {
  await database.run(
    `INSERT INTO participants (name, telegram, custom_1, custom_2) VALUES (?, ?, 'grey', '')`,
    [name, username]
  );
  const created = await findByTelegram(username);
  if (!created) throw new Error("Failed to create participant");
  return created;
}

export async function upsertStatus(
  id: number,
  color: StatusColor,
  text?: string | null
): Promise<void> {
  await database.run(
    `UPDATE participants SET custom_1 = ?, custom_2 = ? WHERE id = ?`,
    [color, text ?? "", id]
  );
}

export async function updateField(
  id: number,
  field: string,
  value: string | string[] | null
): Promise<void> {
  const allowed = new Set([
    "name",
    "bio",
    "linkedin",
    "email",
    "startup_name",
    "startup_stage",
    "startup_description",
    "skills",
    "looking_for",
    "can_help",
    "needs_help",
    "ai_usage",
    "custom_2",
  ]);
  if (!allowed.has(field)) throw new Error(`Field ${field} not allowed`);

  const dbValue =
    Array.isArray(value) && value ? JSON.stringify(value) : typeof value === "string" ? value : null;

  await database.run(`UPDATE participants SET ${field} = ? WHERE id = ?`, [dbValue, id]);
}

export async function searchParticipants(filters: SearchFilters): Promise<Participant[]> {
  const where: string[] = [];
  const params: any[] = [];

  if (filters.availability === "green") {
    where.push(`custom_1 = 'green'`);
  } else if (filters.availability === "green-yellow") {
    where.push(`custom_1 IN ('green','yellow')`);
  }

  if (filters.query) {
    const like = `%${filters.query.toLowerCase()}%`;
    where.push(
      `(
        lower(name) LIKE ?
        OR lower(startup_name) LIKE ?
        OR lower(startup_description) LIKE ?
        OR lower(looking_for) LIKE ?
        OR lower(skills) LIKE ?
        OR lower(bio) LIKE ?
        OR lower(can_help) LIKE ?
        OR lower(needs_help) LIKE ?
        OR lower(ai_usage) LIKE ?
        OR lower(email) LIKE ?
        OR lower(linkedin) LIKE ?
        OR lower(custom_2) LIKE ?
        OR lower(startup_stage) LIKE ?
      )`,
    );
    params.push(like, like, like, like, like, like, like, like, like, like, like, like, like);
  }

  const limit = filters.pageSize;
  const offset = filters.page * filters.pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const order = availabilityOrderExpr();

  const rows = await database.all<any>(
    `SELECT * FROM participants ${whereSql} ORDER BY ${order}, datetime(updated_at) DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows.map(mapRow);
}

export function sanitizeProfileInput(field: string, value: string): string | string[] | null {
  switch (field) {
    case "name":
      return clampText(value, 80);
    case "bio":
      return clampText(value, 300);
    case "linkedin":
      return safeUrl(clampText(value, 120));
    case "email":
      return clampText(value, 120);
    case "startup_name":
      return clampText(value, 120);
    case "startup_stage":
      return clampText(value, 80);
    case "startup_description":
      return clampText(value, 200);
    case "ai_usage":
      return clampText(value, 120);
    case "skills":
    case "looking_for":
    case "can_help":
    case "needs_help":
      return parseListInput(value);
    case "custom_2":
      return clampText(value, 120);
    default:
      return clampText(value, 120);
  }
}

export async function upsertParticipantFromMessage(
  username: string,
  displayName: string
): Promise<Participant> {
  const found = await findByTelegram(username);
  if (found) return found;
  return createParticipant(username, displayName || username);
}

