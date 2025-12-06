import { Participant, SearchFilters, StatusColor } from "./types.ts";
import { STATUS_EMOJI, escapeHtml, formatList, statusLabel } from "./utils.ts";
import TelegramBot from "node-telegram-bot-api";

export function mainMenuText(user: Participant): string {
  const statusLine = `${STATUS_EMOJI[user.custom_1]} ${statusLabel(user.custom_1)}`;
  const statusText = user.custom_2 ? `“${user.custom_2}”` : "No text set.";
  return [
    `Hi ${user.name || user.telegram || "there"}!`,
    `Set and share your availability for the event. You can also find other attendees by availability and search keywords.`,
    ``,
    `Current status: ${statusLine}`,
    statusText,
    ``,
    `Choose an option below.`,
  ].join("\n");
}

export function mainMenuKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Set Status", callback_data: "menu:set_status" },
        { text: "Browse / Search", callback_data: "menu:search" },
      ],
      [
        { text: "My Profile", callback_data: "menu:profile" },
        { text: "Help / About", callback_data: "menu:help" },
      ],
    ],
  };
}

export function statusView(user: Participant): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const text = [
    `Status: ${STATUS_EMOJI[user.custom_1]} ${statusLabel(user.custom_1)}`,
    user.custom_2 ? `Note: “${user.custom_2}”` : "No status text yet. Send a short note to set it.",
    "",
    "What the colors mean:",
    "🟢 Green — talk to me freely.",
    "🟡 Yellow — open to some kinds of talk.",
    "🔴 Red — not open to talking right now.",
  ].join("\n");

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "🟢 Green", callback_data: "status:set:green" },
        { text: "🟡 Yellow", callback_data: "status:set:yellow" },
        { text: "🔴 Red", callback_data: "status:set:red" },
      ],
      [{ text: "⬅️ Back", callback_data: "menu:back" }],
    ],
  };

  return { text, keyboard };
}

export function profileView(user: Participant): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const lines = [
    `👤 Profile`,
    `Name: ${user.name || "—"}`,
    `Telegram: @${user.telegram ?? "—"}`,
    `Status: ${STATUS_EMOJI[user.custom_1]} ${statusLabel(user.custom_1)} ${user.custom_2 ? `“${user.custom_2}”` : ""}`,
    `Bio: ${user.bio ?? "—"}`,
    `Skills: ${formatList(user.skills)}`,
    `Looking for: ${formatList(user.looking_for)}`,
    `Can help with: ${formatList(user.can_help)}`,
    `Needs help with: ${formatList(user.needs_help)}`,
    `Startup: ${user.startup_name ?? "—"} (${user.startup_stage ?? "—"})`,
    `About startup: ${user.startup_description ?? "—"}`,
    `LinkedIn: ${user.linkedin ?? "—"}`,
    `Email: ${user.email ?? "—"}`,
    `AI usage: ${user.ai_usage ?? "—"}`,
  ];

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: "Update info", callback_data: "profile:update" }],
      [{ text: "⬅️ Back to menu", callback_data: "menu:back" }],
    ],
  };

  return { text: lines.join("\n"), keyboard };
}

export function updateFieldPicker(): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const text = "Choose a field to update:";
  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "Name", callback_data: "update:field:name" },
        { text: "Bio", callback_data: "update:field:bio" },
      ],
      [
        { text: "LinkedIn", callback_data: "update:field:linkedin" },
        { text: "Email", callback_data: "update:field:email" },
      ],
      [
        { text: "Skills", callback_data: "update:field:skills" },
        { text: "Looking for", callback_data: "update:field:looking_for" },
      ],
      [
        { text: "Can help", callback_data: "update:field:can_help" },
        { text: "Needs help", callback_data: "update:field:needs_help" },
      ],
      [
        { text: "Startup name", callback_data: "update:field:startup_name" },
        { text: "Startup stage", callback_data: "update:field:startup_stage" },
      ],
      [
        { text: "Startup description", callback_data: "update:field:startup_description" },
        { text: "AI usage", callback_data: "update:field:ai_usage" },
      ],
      [{ text: "Cancel", callback_data: "update:cancel" }],
    ],
  };
  return { text, keyboard };
}

export function promptForField(field: string, current: string | string[] | null): string {
  const friendly = (f: string) => f.replaceAll("_", " ");
  const currentVal = Array.isArray(current) ? current.join(", ") : current ?? "—";
  return `Send a new value for "${friendly(field)}". Current: ${currentVal}\nArrays: comma-separated, max 7 items.`;
}

export function searchFiltersText(filters: SearchFilters): string {
  const availability =
    filters.availability === "green"
      ? "Green only"
      : filters.availability === "green-yellow"
      ? "Green + Yellow"
      : "Everyone";
  const query = filters.query ? `Query: "${escapeHtml(filters.query)}"` : "No text filter";
  return `Filters: ${availability}; ${query}`;
}

export function searchKeyboard(filters: SearchFilters, hasNext: boolean): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Green", callback_data: "search:filter:green" },
        { text: "Green+Yellow", callback_data: "search:filter:green-yellow" },
        { text: "All", callback_data: "search:filter:all" },
      ],
      [
        { text: "Prev", callback_data: "search:page:prev" },
        { text: "Next", callback_data: hasNext ? "search:page:next" : "search:page:none" },
      ],
      [{ text: "Clear query", callback_data: "search:clear" }],
      [{ text: "⬅️ Back", callback_data: "menu:back" }],
    ],
  };
}

export function renderSearchResults(
  results: Participant[],
  filters: SearchFilters,
  botUsername?: string
): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  if (results.length === 0) {
    return {
      text: `Search/browse: send a word to filter by name, role, skills, or looking for.\nUse "Clear query" to reset.\n\nNo matches yet.\n${searchFiltersText(filters)}`,
      keyboard: searchKeyboard(filters, false),
    };
  }

  const cards = results.map((r) => {
    const link = r.telegram ? `@${escapeHtml(r.telegram)}` : null;
    const nameLine = link
      ? `${STATUS_EMOJI[r.custom_1]} ${escapeHtml(r.name)} — ${link}`
      : `${STATUS_EMOJI[r.custom_1]} ${escapeHtml(r.name)}`;
    const viewLink =
      botUsername && r.id
        ? `<a href="https://t.me/${botUsername}?start=vp_${r.id}">See full profile</a>`
        : null;
    return [
      nameLine || undefined,
      r.custom_2 ? `“${escapeHtml(r.custom_2)}”` : null,
      r.bio ? `Bio: ${escapeHtml(r.bio)}` : null,
      r.skills.length ? `Skills: ${escapeHtml(formatList(r.skills))}` : null,
      r.looking_for.length ? `Looking for: ${escapeHtml(formatList(r.looking_for))}` : null,
      viewLink,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return {
    text: [
      `Search/browse: send a word to filter by name, role, skills, or looking for.`,
      `Use "Clear query" to reset.`,
      `Results (page ${filters.page + 1})`,
      searchFiltersText(filters),
      "",
      cards.join("\n\n"),
    ].join("\n"),
    keyboard: searchKeyboard(filters, results.length === filters.pageSize),
  };
}

export function publicProfileView(user: Participant): { text: string } {
  const text = [
    `👤 ${escapeHtml(user.name)} ${user.telegram ? `(@${escapeHtml(user.telegram)})` : ""}`,
    `${STATUS_EMOJI[user.custom_1]} ${statusLabel(user.custom_1)}${user.custom_2 ? ` — “${escapeHtml(user.custom_2)}”` : ""}`,
    `Bio: ${escapeHtml(user.bio ?? "—")}`,
    `Skills: ${escapeHtml(formatList(user.skills))}`,
    `Looking for: ${escapeHtml(formatList(user.looking_for))}`,
    `Can help: ${escapeHtml(formatList(user.can_help))}`,
    `Needs help: ${escapeHtml(formatList(user.needs_help))}`,
    `Startup: ${escapeHtml(user.startup_name ?? "—")} (${escapeHtml(user.startup_stage ?? "—")})`,
    `About startup: ${escapeHtml(user.startup_description ?? "—")}`,
    `LinkedIn: ${escapeHtml(user.linkedin ?? "—")}`,
    `Email: ${escapeHtml(user.email ?? "—")}`,
    `AI usage: ${escapeHtml(user.ai_usage ?? "—")}`,
  ].join("\n");
  return { text };
}

export function helpText(): string {
  return [
    "Set your status with the buttons; send a short note to add context.",
    "Browse/search to find people (filters: Green, Green+Yellow, Everyone).",
    "Profile lets you edit your details; arrays use comma-separated input.",
    "If something breaks, try again or contact the organizer.",
  ].join("\n");
}

