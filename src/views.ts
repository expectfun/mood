import { Participant, SearchFilters, StatusColor, Language } from "./types.ts";
import { STATUS_EMOJI, escapeHtml, formatList } from "./utils.ts";
import { friendlyFieldName, statusLabelLocalized, t } from "./i18n.ts";
import TelegramBot from "node-telegram-bot-api";

export function mainMenuText(user: Participant): string {
  const lang = user.language || "en";
  const statusLine = `${STATUS_EMOJI[user.custom_1]} ${statusLabelLocalized(user.custom_1, lang)}`;
  const statusText = user.custom_2
    ? t(lang, "status_note", { text: escapeHtml(user.custom_2) })
    : t(lang, "main_no_status_text");
  return [
    `${t(lang, "hi")} ${user.name || user.telegram || "there"}!`,
    t(lang, "main_intro"),
    ``,
    `${t(lang, "label_status")}: ${statusLine}`,
    statusText,
    ``,
    t(lang, "main_choose"),
  ].join("\n");
}

export function mainMenuKeyboard(lang: Language): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_main_status"), callback_data: "menu:set_status" },
        { text: t(lang, "btn_main_profile"), callback_data: "menu:profile" },
      ],
      [
        { text: t(lang, "btn_main_search"), callback_data: "menu:search" },
        { text: t(lang, "btn_main_help"), callback_data: "menu:help" },
      ],
    ],
  };
}

export function statusView(user: Participant): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const lang = user.language || "en";
  const text = [
    `${t(lang, "label_status")}: ${STATUS_EMOJI[user.custom_1]} ${statusLabelLocalized(user.custom_1, lang)}`,
    user.custom_2 ? t(lang, "status_note", { text: escapeHtml(user.custom_2) }) : t(lang, "main_no_status_text"),
    "",
    t(lang, "status_colors"),
    t(lang, "status_green"),
    t(lang, "status_yellow"),
    t(lang, "status_red"),
  ].join("\n");

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: t(lang, "btn_status_green"), callback_data: "status:set:green" },
        { text: t(lang, "btn_status_yellow"), callback_data: "status:set:yellow" },
        { text: t(lang, "btn_status_red"), callback_data: "status:set:red" },
      ],
      [{ text: t(lang, "btn_back"), callback_data: "menu:back" }],
    ],
  };

  return { text, keyboard };
}

export function profileView(user: Participant): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const lang = user.language || "en";
  const lines = [
    `👤 ${t(lang, "profile_title")}`,
    `${t(lang, "label_name")}: ${escapeHtml(user.name) || t(lang, "label_not_set")}`,
    `${t(lang, "label_telegram")}: @${escapeHtml(user.telegram ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_status")}: ${STATUS_EMOJI[user.custom_1]} ${statusLabelLocalized(user.custom_1, lang)} ${
      user.custom_2 ? `“${escapeHtml(user.custom_2)}”` : ""
    }`,
    `${t(lang, "label_bio")}: ${escapeHtml(user.bio ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_skills")}: ${escapeHtml(formatList(user.skills))}`,
    `${t(lang, "label_looking_for")}: ${escapeHtml(formatList(user.looking_for))}`,
    `${t(lang, "label_can_help")}: ${escapeHtml(formatList(user.can_help))}`,
    `${t(lang, "label_needs_help")}: ${escapeHtml(formatList(user.needs_help))}`,
    `${t(lang, "label_startup")}: ${escapeHtml(user.startup_name ?? t(lang, "label_not_set"))} (${escapeHtml(
      user.startup_stage ?? t(lang, "label_not_set")
    )})`,
    `${t(lang, "label_startup_about")}: ${escapeHtml(user.startup_description ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_linkedin")}: ${escapeHtml(user.linkedin ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_email")}: ${escapeHtml(user.email ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_ai_usage")}: ${escapeHtml(user.ai_usage ?? t(lang, "label_not_set"))}`,
  ];

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: t(lang, "btn_update_info"), callback_data: "profile:update" }],
      [{ text: t(lang, "btn_profile_back"), callback_data: "menu:back" }],
    ],
  };

  return { text: lines.join("\n"), keyboard };
}

export function updateFieldPicker(lang: Language): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const text = t(lang, "update_choose_field");
  const make = (field: string) => ({ text: friendlyFieldName(field, lang), callback_data: `update:field:${field}` });
  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [make("name"), make("bio")],
      [make("linkedin"), make("email")],
      [make("skills"), make("looking_for")],
      [make("can_help"), make("needs_help")],
      [make("startup_name"), make("startup_stage")],
      [make("startup_description"), make("ai_usage")],
      [{ text: t(lang, "btn_back"), callback_data: "update:cancel" }],
    ],
  };
  return { text, keyboard };
}

export function promptForField(field: string, current: string | string[] | null, lang: Language): string {
  const currentVal = Array.isArray(current) ? current.join(", ") : current ?? t(lang, "label_not_set");
  return t(lang, "prompt_field", { field: friendlyFieldName(field, lang), current: currentVal });
}

export function searchFiltersText(filters: SearchFilters): string {
  const lang = (filters as any as { lang?: Language }).lang || "en";
  const availability =
    filters.availability === "green"
      ? t(lang, "availability_green_only")
      : filters.availability === "green-yellow"
      ? t(lang, "availability_green_yellow")
      : t(lang, "availability_all");
  const query = filters.query
    ? `${t(lang, "search_query_label")}: "${escapeHtml(filters.query)}"`
    : t(lang, "search_no_text_filter");
  return `${t(lang, "label_status")}: ${availability}; ${query}`;
}

export function searchKeyboard(filters: SearchFilters, hasNext: boolean): TelegramBot.InlineKeyboardMarkup {
  const lang = (filters as any as { lang?: Language }).lang || "en";
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_search_filter_green"), callback_data: "search:filter:green" },
        { text: t(lang, "btn_search_filter_green_yellow"), callback_data: "search:filter:green-yellow" },
        { text: t(lang, "btn_search_filter_all"), callback_data: "search:filter:all" },
      ],
      [
        { text: t(lang, "btn_prev"), callback_data: "search:page:prev" },
        { text: t(lang, "btn_next"), callback_data: hasNext ? "search:page:next" : "search:page:none" },
      ],
      [{ text: t(lang, "btn_clear_query"), callback_data: "search:clear" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu:back" }],
    ],
  };
}

export function renderSearchResults(
  results: Participant[],
  filters: SearchFilters,
  botUsername?: string
): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const lang = (filters as any as { lang?: Language }).lang || "en";
  if (results.length === 0) {
    return {
      text: `${t(lang, "search_hint")}\n${t(lang, "search_reset_hint")}\n\n${t(lang, "search_no_matches")}\n${searchFiltersText(filters)}`,
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
        ? `<a href="https://t.me/${botUsername}?start=vp_${r.id}">${t(lang, "search_full_profile")}</a>`
        : null;
    return [
      nameLine || undefined,
      r.custom_2 ? `“${escapeHtml(r.custom_2)}”` : null,
      r.bio ? `${t(lang, "label_bio")}: ${escapeHtml(r.bio)}` : null,
      r.skills.length ? `${t(lang, "label_skills")}: ${escapeHtml(formatList(r.skills))}` : null,
      r.looking_for.length ? `${t(lang, "label_looking_for")}: ${escapeHtml(formatList(r.looking_for))}` : null,
      viewLink,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return {
    text: [
      t(lang, "search_hint"),
      t(lang, "search_reset_hint"),
      t(lang, "search_results", { page: filters.page + 1 }),
      searchFiltersText(filters),
      "",
      cards.join("\n\n"),
    ].join("\n"),
    keyboard: searchKeyboard(filters, results.length === filters.pageSize),
  };
}

export function publicProfileView(user: Participant): { text: string } {
  const lang = user.language || "en";
  const text = [
    `👤 ${escapeHtml(user.name)} ${user.telegram ? `(@${escapeHtml(user.telegram)})` : ""}`,
    `${STATUS_EMOJI[user.custom_1]} ${statusLabelLocalized(user.custom_1, lang)}${
      user.custom_2 ? ` — “${escapeHtml(user.custom_2)}”` : ""
    }`,
    `${t(lang, "label_bio")}: ${escapeHtml(user.bio ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_skills")}: ${escapeHtml(formatList(user.skills))}`,
    `${t(lang, "label_looking_for")}: ${escapeHtml(formatList(user.looking_for))}`,
    `${t(lang, "label_can_help")}: ${escapeHtml(formatList(user.can_help))}`,
    `${t(lang, "label_needs_help")}: ${escapeHtml(formatList(user.needs_help))}`,
    `${t(lang, "label_startup")}: ${escapeHtml(user.startup_name ?? t(lang, "label_not_set"))} (${escapeHtml(
      user.startup_stage ?? t(lang, "label_not_set")
    )})`,
    `${t(lang, "label_startup_about")}: ${escapeHtml(user.startup_description ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_linkedin")}: ${escapeHtml(user.linkedin ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_email")}: ${escapeHtml(user.email ?? t(lang, "label_not_set"))}`,
    `${t(lang, "label_ai_usage")}: ${escapeHtml(user.ai_usage ?? t(lang, "label_not_set"))}`,
  ].join("\n");
  return { text };
}

export function helpView(lang: Language): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  return {
    text: t(lang, "help_text"),
    keyboard: {
      inline_keyboard: [
        [
          { text: t(lang, "lang_label_en"), callback_data: "lang:set:en" },
          { text: t(lang, "lang_label_ru"), callback_data: "lang:set:ru" },
          { text: t(lang, "lang_label_ka"), callback_data: "lang:set:ka" },
        ],
        [{ text: t(lang, "btn_back"), callback_data: "menu:back" }],
      ],
    },
  };
}

