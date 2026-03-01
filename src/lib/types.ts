export interface Source {
  title: string;
  url: string;
}

export interface Development {
  id: string;
  story_id: string;
  date: string;
  date_sort: string;
  source_label: string;
  source_color: string;
  headline: string;
  summary: string;
  sources: Source[];
  is_turning_point: boolean;
  position: number;
}

export type StoryCategory =
  | "geopolitics"
  | "tech"
  | "health"
  | "economy"
  | "science"
  | "culture";

export const STORY_CATEGORIES: StoryCategory[] = [
  "geopolitics",
  "tech",
  "health",
  "economy",
  "science",
  "culture",
];

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  event_query: string;
  status: "developing" | "concluded";
  category: StoryCategory | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  developments?: Development[];
}

export interface GenerateRequest {
  event_query: string;
}

export interface GenerateResponse {
  story_id: string;
}
