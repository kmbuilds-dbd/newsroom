# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Newsroom** is a tool for understanding past news events in depth. A user enters an event name, Claude researches it via the Anthropic API, and the app generates an interactive visual timeline of key developments with source links.

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Supabase** (Postgres) for storage
- **Anthropic SDK** (`@anthropic-ai/sdk`) for AI generation
- **html2canvas** for PNG export
- Deploy target: **Vercel**

## Architecture

Monolithic Next.js app — pages, API routes, AI orchestration, and Supabase calls all in one project. API-first design so a future iOS app can consume the same endpoints.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home — search bar + saved story list
│   ├── story/[id]/page.tsx         # Interactive timeline view
│   └── api/stories/
│       ├── generate/route.ts       # POST: AI generation pipeline
│       └── [id]/route.ts           # GET: fetch story by ID
├── components/
│   ├── Timeline.tsx                # Main vertical timeline
│   ├── TimelineCard.tsx            # Individual event card
│   ├── StoryHeader.tsx             # Title, subtitle, status badge
│   └── SearchBar.tsx               # Event name input
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── anthropic.ts                # Claude API wrapper + prompt
│   └── types.ts                    # Shared TypeScript types
└── styles/globals.css              # Tailwind + dark theme
```

## Data Model (Supabase)

**stories**: id, title, subtitle, event_query, status (developing/concluded), created_at, updated_at

**developments**: id, story_id (FK), date, date_sort, source_label, source_color, headline, summary, sources (jsonb), is_turning_point, position

## AI Pipeline

`POST /api/stories/generate` → Claude API (structured JSON response) → insert into Supabase → return story ID

## Visual Design (from concept.jpg)

- Dark background, editorial typography (monospace for dates/labels, serif italic for titles)
- Vertical center-line timeline with alternating left/right cards
- Color-coded source labels per actor (Pentagon, Anthropic, etc.)
- Turning points get distinct visual treatment
- Click to expand: full summary + source links

## Environment Variables

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Design Review

Use the **impeccable** plugin to review UI quality during development.

## Roadmap

### Phase 1 — Core (current)
- AI-generated timeline from event name
- Interactive timeline view with expandable cards
- Story persistence and browsing
- PNG export

### Phase 2 — Extensions
- **Chrome extension**: Generate a story timeline from any webpage
- **Story library**: Browse by category
- **Tagging**: Topics, actors, themes for cross-referencing
- **Search**: Full-text across stories and developments
- **iOS app**: Native app consuming the same API

## Key Documents

- `concept.md` — Original product spec
- `concept.jpg` — Visual mockup
- `docs/plans/2026-02-27-newsroom-design.md` — Full design document
