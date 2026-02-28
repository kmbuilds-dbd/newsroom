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

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  event_query: string;
  status: "developing" | "concluded";
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
