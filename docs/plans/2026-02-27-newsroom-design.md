# Newsroom — Design Document

**Date**: 2026-02-27
**Status**: Approved

## Overview

Newsroom is a tool for understanding past news events in depth. A user enters an event name, Claude researches it, and the app generates an interactive visual timeline of key developments — matching the editorial style in `concept.jpg`.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data source | AI-generated via Claude API | Fully automated timeline creation |
| Static output | Screenshot/export of web app | One rendering path, export via html2canvas |
| Persistence | Save & browse (Supabase) | Enables library, search, tagging in Phase 2 |
| Architecture | Monolithic Next.js | Fastest to ship; extract API for iOS later |
| Tech stack | Next.js 14+ / TypeScript / Tailwind / Supabase | Modern, deployable to Vercel |
| LLM provider | Anthropic (Claude) | Already in ecosystem |
| Design review | Impeccable plugin | Review UI quality during development |

## Data Model

### Stories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | e.g. "The AI Standoff" |
| subtitle | text | Descriptive tagline |
| event_query | text | Original user input |
| status | text | "developing" / "concluded" |
| created_at | timestamp | |
| updated_at | timestamp | |

### Developments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| story_id | uuid | FK to stories |
| date | text | Display date (e.g. "JAN 9, 2026") |
| date_sort | timestamp | For ordering |
| source_label | text | e.g. "PENTAGON", "ANTHROPIC" |
| source_color | text | Hex color for the label |
| headline | text | Bold title |
| summary | text | 1-3 sentence description |
| sources | jsonb | Array of {title, url} |
| is_turning_point | boolean | Highlighted as significant |
| position | int | Sort order within the story |

## AI Pipeline

1. User enters event name on home page
2. `POST /api/stories/generate` receives the query
3. Claude API call with structured prompt requesting: title, subtitle, status, chronological developments with dates, sources, headlines, summaries, source URLs, turning point flags
4. Claude returns structured JSON (JSON mode)
5. Story + developments inserted into Supabase
6. Frontend navigates to `/story/[id]`

Loading UX: show title first, then developments populate progressively as streamed/parsed.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — search bar + saved story list |
| `/story/[id]` | Interactive timeline view |

### Home (`/`)
- Large centered search input: "Enter a news event..."
- Grid/list of previously generated stories (title, subtitle, date, status badge)

### Timeline (`/story/[id]`)
- Header: status badge, serif italic title, subtitle, date range
- Vertical center-line timeline with alternating left/right cards
- Card: date, colored source tag, bold headline, summary
- Click to expand: full summary + source links
- Turning points: distinct visual treatment (glow, larger dot)
- Export button: PNG via html2canvas

## Visual Style (matching concept.jpg)
- Dark background (#1a1a2e or similar)
- Light text
- Monospace for dates/labels, serif italic for titles
- Each actor/source gets a color from a predefined palette
- Editorial / investigative journalism tone

## Project Structure

```
newsroom/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home
│   │   ├── story/[id]/page.tsx         # Timeline view
│   │   └── api/stories/
│   │       ├── generate/route.ts       # AI generation
│   │       └── [id]/route.ts           # Get story
│   ├── components/
│   │   ├── Timeline.tsx
│   │   ├── TimelineCard.tsx
│   │   ├── StoryHeader.tsx
│   │   └── SearchBar.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── anthropic.ts
│   │   └── types.ts
│   └── styles/globals.css
├── supabase/migrations/
├── .env.local
└── package.json
```

## Environment Variables
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Roadmap

### Phase 1 — Core (this design)
- Timeline generation from event name
- Interactive timeline view with expandable cards
- Story persistence and browsing
- PNG export

### Phase 2 — Extensions
- Chrome extension: generate a story from any webpage
- Story library: browse by category
- Tagging: topics, actors, themes for cross-referencing
- Search: full-text across stories and developments
- iOS app (consuming the same API)
