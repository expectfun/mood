import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { initSchema } from "./db.ts";
import {
  searchParticipants,
  sanitizeProfileInput,
  updateField,
  upsertParticipantFromMessage,
  upsertStatus,
  findByTelegram,
  findById,
} from "./repository.ts";
import {
  helpText,
  mainMenuKeyboard,
  mainMenuText,
  profileView,
  promptForField,
  renderSearchResults,
  statusView,
  updateFieldPicker,
  publicProfileView,
} from "./views.ts";
import { SessionState, StatusColor } from "./types.ts";
import { logger } from "./logging.ts";

dotenv.config();

const token = process.env.MOOD;
if (!token) {
  throw new Error("MOOD token missing. Set MOOD in .env");
}

const bot = new TelegramBot(token, { polling: true });

const sessions = new Map<number, SessionState>();
let botUsername: string | undefined;

function getSession(chatId: number): SessionState {
  const existing = sessions.get(chatId) || { mode: undefined };
  sessions.set(chatId, existing);
  return existing;
}

async function ensureUser(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const username = msg.from?.username;
  if (!username) {
    await bot.sendMessage(chatId, "Please set a Telegram username to use this bot.");
    throw new Error("username_missing");
  }
  const displayName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || username;
  const user = await upsertParticipantFromMessage(username, displayName);
  return user;
}

async function showMenu(chatId: number, username: string) {
  const user = await findByTelegram(username);
  if (!user) return;
  await bot.sendMessage(chatId, mainMenuText(user), { reply_markup: mainMenuKeyboard() });
}

async function handleStatus(chatId: number, username: string) {
  const user = await findByTelegram(username);
  if (!user) return;
  const { text, keyboard } = statusView(user);
  const session = getSession(chatId);
  session.mode = "status";
  await bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

async function handleProfile(chatId: number, username: string) {
  const user = await findByTelegram(username);
  if (!user) return;
  const { text, keyboard } = profileView(user);
  const session = getSession(chatId);
  session.mode = undefined;
  await bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

async function handleSearch(chatId: number, username: string, incoming?: SessionState) {
  const session = getSession(chatId);
  session.mode = "search";
  const filters = incoming?.search || session.search || { availability: "green-yellow", page: 0, pageSize: 5 };
  session.search = filters;
  const user = await findByTelegram(username);
  if (!user) return;
  const results = await searchParticipants(filters);
  const payload = renderSearchResults(results, filters, botUsername);
  await bot.sendMessage(chatId, payload.text, { reply_markup: payload.keyboard });
}

async function showPublicProfile(chatId: number, id: number) {
  const target = await findById(id);
  if (!target) {
    await bot.sendMessage(chatId, "Profile not found.");
    return;
  }
  const detail = publicProfileView(target);
  await bot.sendMessage(chatId, detail.text, {
    reply_markup: { inline_keyboard: [[{ text: "⬅️ Back to search", callback_data: "menu:search" }]] },
  });
}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const user = await ensureUser(msg);
    const payload = match && match[1] ? match[1].trim() : "";
    if (payload.startsWith("vp_")) {
      const id = Number(payload.replace("vp_", ""));
      if (Number.isFinite(id)) {
        await showPublicProfile(msg.chat.id, id);
        return;
      }
    }
    await showMenu(msg.chat.id, user.telegram!);
  } catch (err) {
    if ((err as Error).message !== "username_missing") logger.error("start failed", { err: (err as Error).message });
  }
});

bot.onText(/\/status/, async (msg) => {
  try {
    const user = await ensureUser(msg);
    await handleStatus(msg.chat.id, user.telegram!);
  } catch (err) {
    if ((err as Error).message !== "username_missing")
      logger.error("status command failed", { err: (err as Error).message });
  }
});

bot.onText(/\/profile/, async (msg) => {
  try {
    const user = await ensureUser(msg);
    await handleProfile(msg.chat.id, user.telegram!);
  } catch (err) {
    if ((err as Error).message !== "username_missing")
      logger.error("profile command failed", { err: (err as Error).message });
  }
});

bot.onText(/\/search/, async (msg) => {
  try {
    const user = await ensureUser(msg);
    await handleSearch(msg.chat.id, user.telegram!);
  } catch (err) {
    if ((err as Error).message !== "username_missing")
      logger.error("search command failed", { err: (err as Error).message });
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    await ensureUser(msg);
    await bot.sendMessage(msg.chat.id, helpText());
  } catch (err) {
    if ((err as Error).message !== "username_missing")
      logger.error("help command failed", { err: (err as Error).message });
  }
});

bot.on("callback_query", async (cb) => {
  const data = cb.data;
  const message = cb.message;
  if (!message || !data) return;
  const chatId = message.chat.id;
  const username = cb.from.username;
  if (!username) {
    await bot.sendMessage(chatId, "Please set a Telegram username to use this bot.");
    return;
  }
  const session = getSession(chatId);

  try {
    try {
      await bot.answerCallbackQuery(cb.id);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("query is too old") || msg.includes("query ID is invalid")) {
        logger.warn("Stale callback ignored", { cbId: cb.id });
        return;
      }
      logger.error("answerCallbackQuery failed", { cbId: cb.id, err: msg });
      await bot.sendMessage(chatId, "This action expired. Please tap again from the latest message.");
      return;
    }

    if (data === "menu:set_status") {
      await handleStatus(chatId, username);
      return;
    }
    if (data === "menu:profile") {
      await handleProfile(chatId, username);
      return;
    }
    if (data === "menu:search") {
      await handleSearch(chatId, username, session);
      return;
    }
    if (data === "menu:help") {
      await bot.sendMessage(chatId, helpText());
      return;
    }
    if (data === "menu:back") {
      await showMenu(chatId, username);
      session.mode = undefined;
      session.pendingField = undefined;
      return;
    }

    if (data.startsWith("status:set:")) {
      const color = data.split(":")[2] as StatusColor;
      const user = await findByTelegram(username);
      if (!user) return;
      await upsertStatus(user.id, color, user.custom_2);
      await handleStatus(chatId, username);
      return;
    }

    if (data === "profile:update") {
      const picker = updateFieldPicker();
      session.mode = "update_field";
      session.pendingField = undefined;
      await bot.sendMessage(chatId, picker.text, { reply_markup: picker.keyboard });
      return;
    }

    if (data === "update:cancel") {
      session.mode = undefined;
      session.pendingField = undefined;
      await handleProfile(chatId, username);
      return;
    }

    if (data.startsWith("update:field:")) {
      const field = data.split(":")[2] as SessionState["pendingField"];
      session.mode = "update_field";
      session.pendingField = field;
      const user = await findByTelegram(username);
      const current =
        field && user
          ? (user as any)[field] ?? (Array.isArray((user as any)[field]) ? [] : null)
          : null;
      await bot.sendMessage(chatId, promptForField(field!, current));
      return;
    }

    if (data.startsWith("search:filter:")) {
      const availability = data.split(":")[2] as SessionState["search"]["availability"];
      session.search = {
        availability,
        query: session.search?.query,
        page: 0,
        pageSize: session.search?.pageSize || 5,
      };
      await handleSearch(chatId, username, session);
      return;
    }

    if (data === "search:clear") {
      const current = session.search || { availability: "green-yellow", page: 0, pageSize: 5 };
      session.search = { ...current, query: undefined, page: 0 };
      await handleSearch(chatId, username, session);
      return;
    }

    if (data.startsWith("search:page:")) {
      const dir = data.split(":")[2];
      if (dir !== "next" && dir !== "prev") return;
      const current = session.search || { availability: "green-yellow", page: 0, pageSize: 5 };
      const nextPage = dir === "next" ? current.page + 1 : Math.max(0, current.page - 1);
      session.search = { ...current, page: nextPage };
      await handleSearch(chatId, username, session);
      return;
    }
  } catch (err) {
    logger.error("callback failed", { data, err: (err as Error).message });
    await bot.sendMessage(chatId, "Something went wrong. Please try again.");
  }
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const chatId = msg.chat.id;
  try {
    const user = await ensureUser(msg);
    const session = getSession(chatId);

    if (session.mode === "status") {
      const note = sanitizeProfileInput("custom_2", msg.text) as string;
      await upsertStatus(user.id, user.custom_1, note);
      await handleStatus(chatId, user.telegram!);
      return;
    }

    if (session.mode === "update_field" && session.pendingField) {
      const sanitized = sanitizeProfileInput(session.pendingField, msg.text);
      await updateField(user.id, session.pendingField, sanitized as any);
      session.pendingField = undefined;
      session.mode = undefined;
      await handleProfile(chatId, user.telegram!);
      return;
    }

    if (session.mode === "search") {
      session.search = session.search || { availability: "green-yellow", page: 0, pageSize: 5 };
      session.search.query = msg.text.trim();
      session.search.page = 0;
      await handleSearch(chatId, user.telegram!, session);
      return;
    }

    // Fallback: show menu
    await showMenu(chatId, user.telegram!);
  } catch (err) {
    if ((err as Error).message === "username_missing") return;
    logger.error("message handler failed", { err: (err as Error).message });
    await bot.sendMessage(chatId, "Error processing your message. Please try again.");
  }
});

async function bootstrap() {
  await initSchema();
  try {
    const me = await bot.getMe();
    botUsername = me.username;
    logger.info("Bot username resolved", { botUsername });
  } catch (err) {
    logger.warn("Could not resolve bot username", { err: (err as Error).message });
  }
  logger.info("Bot initialized and polling");
}

bootstrap().catch((err) => {
  logger.error("Failed to start bot", { err: err.message });
  process.exit(1);
});

bot.on("polling_error", (err) => {
  const msg = (err as Error).message || String(err);
  logger.warn("Polling error", { err: msg });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});

