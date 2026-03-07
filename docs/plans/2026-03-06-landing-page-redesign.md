# Landing Page Redesign — Design Document

**Date**: 2026-03-06
**Status**: Approved

## Overview

Redesign the Newsroom landing page from a centered single-column layout to a section-based news dashboard with a left sidebar. RSS headlines are AI-classified into 8 sections, displayed as horizontal rows of square cards with pagination. Saved stories are browsable via sidebar category navigation.

## Layout

Three-zone layout:
- **Left sidebar (~220px fixed):** News section navigation (top) + saved story categories (bottom)
- **Main area (flexible):** Horizontal row of 5 square headline cards with prev/next, saved stories list below
- **Mobile (<768px):** Sidebar collapses to horizontal scrollable pill bar at top

```
┌────────────┬─────────────────────────────────────────┐
│  SECTIONS  │  ← POLITICS (12)              2/3 →    │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  Sports    │  │ S1 │ │ S2 │ │ S3 │ │ S4 │ │ S5 │   │
│  Politics● │  └────┘ └────┘ └────┘ └────┘ └────┘   │
│  Global    │       ◄ Previous    Next ►              │
│  US        │─────────────────────────────────────────│
│  India     │  YOUR STORIES                           │
│  Technology│  ┌─────────────────────────────────┐   │
│  Business  │  │ Story card                       │   │
│  Other     │  └─────────────────────────────────┘   │
│ ────────── │  ┌─────────────────────────────────┐   │
│ MY STORIES │  │ Story card                       │   │
│ Geopolitics│  └─────────────────────────────────┘   │
│ Tech       │  + Add a Story                          │
│ ...        │                                         │
└────────────┴─────────────────────────────────────────┘
```

## News Sections

8 sections for RSS headline classification:
- Sports, Politics, Global, US, India, Technology, Business, Other

These are separate from saved story categories (geopolitics, tech, health, economy, science, culture), which remain unchanged.

## Square Story Cards

~180x180px uniform squares in a horizontal scrollable row (5 visible at a time):

```
┌─────────────────┐
│ BBC        3h   │
│                 │
│ Trump Signs     │
│ Executive Order │
│ on AI Safety    │
│                 │
│            [+]  │
└─────────────────┘
```

- Source badge (colored) top-left, time ago top-right
- Headline in serif font, max 3 lines with ellipsis
- [+] button bottom-right triggers existing onAddStory flow
- Clicking the card opens original article in new tab
- Previous/Next buttons shift by 5 cards

## AI Classification

**New endpoint:** `POST /api/news/classify`

- Receives array of headlines from client
- Sends batch to Claude API with prompt to classify each into one of 8 sections
- Returns `{ classifications: [{ index, section }] }`
- Called once per page load after `/api/news` returns headlines
- Cached in component state for the session

## Left Sidebar

**Top — News Sections:**
- All 8 sections listed, each with count badge
- Empty sections appear dimmed
- Active section has left border accent + bright text
- Default: first section with stories

**Bottom — My Stories:**
- Thin divider separates from news sections
- Lists existing categories (only those with saved stories)
- "All" option at top
- Clicking filters the saved stories list in main area

**Mobile:**
- Becomes horizontal scrollable pill bar
- My Stories section moves below headline cards as filter tabs

## File Changes

**New files:**
- `src/app/api/news/classify/route.ts` — AI classification endpoint
- `src/components/Sidebar.tsx` — left sidebar
- `src/components/SectionCards.tsx` — horizontal square card row with pagination

**Modified files:**
- `src/app/page.tsx` — sidebar + main layout
- `src/components/HomeContent.tsx` — orchestrate layout, section state, classify call
- `src/lib/types.ts` — add NewsSection type

**Replaced:**
- `src/components/TopStories.tsx` — functionality moves to SectionCards

**Unchanged:**
- `src/components/StoryLibrary.tsx`, `StoryList.tsx` — reused in main area lower half
- `src/app/api/news/route.ts` — RSS fetching unchanged
- Story generation, timeline view, auth — untouched
