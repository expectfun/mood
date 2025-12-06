export type StatusColor = "green" | "yellow" | "red" | "grey";

export interface Participant {
  id: number;
  name: string;
  telegram: string | null;
  linkedin: string | null;
  email: string | null;
  photo: string | null;
  bio: string | null;
  skills: string[]; // stored as JSON
  has_startup: boolean;
  startup_stage: string | null;
  startup_name: string | null;
  startup_description: string | null;
  looking_for: string[]; // stored as JSON
  can_help: string[]; // stored as JSON
  needs_help: string[]; // stored as JSON
  ai_usage: string | null;
  custom_1: StatusColor; // status color
  custom_2: string | null; // status text
  custom_array_1: string[]; // extra tags
  updated_at: string;
}

export interface SearchFilters {
  availability: "green" | "green-yellow" | "all";
  query?: string;
  page: number;
  pageSize: number;
}

export interface SessionState {
  mode?: "status" | "update_field" | "search";
  pendingField?:
    | "name"
    | "bio"
    | "linkedin"
    | "email"
    | "startup_name"
    | "startup_stage"
    | "startup_description"
    | "skills"
    | "looking_for"
    | "can_help"
    | "needs_help"
    | "ai_usage"
    | "status_text";
  search?: SearchFilters;
}

