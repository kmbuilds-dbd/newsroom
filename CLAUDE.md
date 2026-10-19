# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Newsroom** is a tool for understanding past news events in depth. A user enters an event name, DeepSeek (via its OpenAI-compatible chat API) generates a timeline, and the app renders an interactive visual timeline of key developments with source links. DeepSeek has no web browsing, so timelines come from training knowledge and the prompt forbids inventing source URLs.

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Supabase** (Postgres) for storage
- **DeepSeek** (`deepseek-chat` via OpenAI-compatible `fetch`) for AI generation — no vendor SDK
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
│   ├── deepseek.ts                 # DeepSeek API wrapper + prompt
│   └── types.ts                    # Shared TypeScript types
└── styles/globals.css              # Tailwind + dark theme
```

## Data Model (Supabase)

**stories**: id, title, subtitle, event_query, status (developing/concluded), created_at, updated_at

**developments**: id, story_id (FK), date, date_sort, source_label, source_color, headline, summary, sources (jsonb), is_turning_point, position

## AI Pipeline

`POST /api/stories/generate` → DeepSeek API (`response_format: json_object`) → insert into Supabase → return story ID

## Visual Design (from concept.jpg)

- Dark background, editorial typography (monospace for dates/labels, serif italic for titles)
- Vertical center-line timeline with alternating left/right cards
- Color-coded source labels per actor (Pentagon, Anthropic, etc.)
- Turning points get distinct visual treatment
- Click to expand: full summary + source links

## Environment Variables

- `DEEPSEEK_API_KEY` (server-side only — never `NEXT_PUBLIC_*`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AUTH_SECRET` — NextAuth session secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (Auth.js)
- `EXTENSION_API_KEY` — shared secret for the Chrome extension's API calls

See `.env.example` for the full list.

## PWA

The app is installable on iPhone via Safari → Share → Add to Home Screen:
- `public/manifest.json` (`display: standalone`, dark theme colors)
- Icons in `public/` (`icon-192.png`, `icon-512.png` maskable, `apple-touch-icon.png`) — generated at build time by `scripts/generate-icons.py` (stdlib-only Python, wired as `prebuild` in `package.json`) and gitignored, so the branch carries no binary icons
- PWA metadata in `src/app/layout.tsx` (`manifest`, `appleWebApp`, `themeColor`, `viewport-fit=cover`)
- `src/proxy.ts` lets the manifest/icons through without a session so the browser can fetch them at install time
- No service worker yet — iOS install works from manifest + meta tags alone. Add one later if offline support is wanted.

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
- **PWA**: Installable via Safari Add to Home Screen (done — see PWA section)

## Key Documents

- `concept.md` — Original product spec
- `concept.jpg` — Visual mockup
- `docs/plans/2026-02-27-newsroom-design.md` — Full design document
