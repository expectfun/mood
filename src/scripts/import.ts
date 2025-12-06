import fs from "fs";
import path from "path";
import { initSchema } from "../db.ts";
import { createParticipant, findByTelegram, updateField } from "../repository.ts";
import { logger } from "../logging.ts";

interface RawParticipant {
  name: string;
  telegram?: string;
  linkedin?: string;
  email?: string;
  photo?: string;
  bio?: string;
  skills?: string[];
  has_startup?: boolean;
  startup_stage?: string;
  startup_name?: string;
  startup_description?: string;
  looking_for?: string[];
  can_help?: string[];
  needs_help?: string[];
  ai_usage?: string;
}

async function readJson(input: string): Promise<RawParticipant[]> {
  if (input.startsWith("http")) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return (await res.json()) as RawParticipant[];
  }
  const filePath = path.resolve(process.cwd(), input);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawParticipant[];
}

async function main() {
  let urlArg: string | undefined;
  let fileArg: string | undefined;

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--url" && process.argv[i + 1]) {
      urlArg = process.argv[i + 1];
      i++;
      continue;
    }
    if (arg.startsWith("--url=")) {
      urlArg = arg.split("=", 2)[1];
      continue;
    }
    if (arg === "--file" && process.argv[i + 1]) {
      fileArg = process.argv[i + 1];
      i++;
      continue;
    }
    if (arg.startsWith("--file=")) {
      fileArg = arg.split("=", 2)[1];
      continue;
    }
  }

  const source = urlArg || fileArg;

  if (!source) {
    console.error("Usage: bun run src/scripts/import.ts --url <url> | --url=<url> | --file <path> | --file=<path>");
    process.exit(1);
  }

  await initSchema();
  const data = await readJson(source);

  let created = 0;
  let skipped = 0;

  for (const p of data) {
    if (!p.telegram) {
      skipped += 1;
      continue;
    }
    const username = p.telegram.replace("@", "");
    const existing = await findByTelegram(username);
    if (existing) {
      skipped += 1;
      continue;
    }
    const participant = await createParticipant(username, p.name || username);
    await updateField(participant.id, "bio", p.bio ?? null);
    await updateField(participant.id, "linkedin", p.linkedin ?? null);
    await updateField(participant.id, "email", p.email ?? null);
    if (p.skills?.length) await updateField(participant.id, "skills", p.skills);
    if (p.looking_for?.length) await updateField(participant.id, "looking_for", p.looking_for);
    if (p.can_help?.length) await updateField(participant.id, "can_help", p.can_help);
    if (p.needs_help?.length) await updateField(participant.id, "needs_help", p.needs_help);
    if (p.startup_name) await updateField(participant.id, "startup_name", p.startup_name);
    if (p.startup_stage) await updateField(participant.id, "startup_stage", p.startup_stage);
    if (p.startup_description)
      await updateField(participant.id, "startup_description", p.startup_description);
    if (p.ai_usage) await updateField(participant.id, "ai_usage", p.ai_usage);
    created += 1;
  }

  logger.info("Import finished", { created, skipped, total: data.length });
}

main().catch((err) => {
  logger.error("Import failed", { error: err.message });
  process.exit(1);
});

