# Leagues VI Task Tracker — Implementation Plan

## Overview

Two components: a **RuneLite plugin** (Java) that reads game state and pushes to a server, and a **web app + API** (your comfort zone) that stores data, serves the UI, and handles multi-user state. The two are decoupled — the plugin doesn't know about the UI, and the web app works even when the plugin isn't running.

---

## Component 1: RuneLite Plugin

**Tech:** Java, IntelliJ, Gradle, RuneLite plugin template

**Responsibilities:**
- On login: read full task completion snapshot + unlocked regions, push to API
- On change: detect newly completed tasks and region unlocks, push deltas to API
- No local UI panel needed — config panel just needs a field for the API base URL and the player's auth token

**Implementation steps:**

**Step 1 — Project setup**
- Generate from RuneLite plugin template
- Set up IntelliJ + Gradle per RuneLite docs
- Get a hello-world plugin running in dev mode

**Step 2 — Stub the data layer**
- Hard-code placeholder `taskVarps` and region `varbits` lists (empty arrays for now)
- Define a `TaskSnapshot` model: a `Set<Integer>` of completed task IDs plus a `Set<Integer>` of unlocked region varbit values
- These stubs get replaced on launch day with real values from the `task-json-store`

**Step 3 — State reading**
Adapted directly from the researched codebase:
- On `onGameTick` after `LOGGING_IN`: read all task VarPlayers using the bitmask pattern (`taskId / 32` for VarPlayer index, `taskId % 32` for bit), read region varbits, build initial snapshot
- Store snapshot in memory

**Step 4 — Change detection**
- `onVarbitChanged`: if the changed VarPlayer is in `taskVarps`, queue it; if the changed varbit is a region varbit, flag it
- `onGameTick` (throttled ~3 seconds): flush queued VarPlayers, diff against snapshot, collect newly completed task IDs and any region changes

**Step 5 — HTTP push**
- On initial login: `POST /api/sync` with full state `{ username, completedTaskIds: [...], unlockedRegions: [...] }`
- On delta: `POST /api/update` with `{ username, newlyCompletedTaskIds: [...], newlyUnlockedRegions: [...] }`
- Include an auth token in the request header (configured in the plugin's config panel)
- Use RuneLite's built-in `OkHttpClient` (already available, no new dependencies needed)

**Step 6 — Launch day data swap**
- Pull the real `taskVarps` and region `varbits` from `task-json-store` once Leagues VI is live
- Slot them in and verify the plugin correctly reads and pushes real task completions

---

## Component 2: Backend API

**Tech:** Node/Express. Postgres database.

**Schema (minimal):**
```
players
  username (PK)
  auth_token
  last_synced_at

player_tasks
  username
  task_id (integer, the game's task ID)
  completed_at

player_regions
  username
  region_varbit
  unlocked_at
```

**Endpoints:**
- `POST /api/sync` — upsert full state for a player (used on login)
- `POST /api/update` — append newly completed tasks/regions (used on delta push)
- `GET /api/player/:username` — return a player's full state (used by web app)
- `GET /api/group?usernames=a,b,c` — return state for multiple players (used for the social view)

Authentication: simple pre-shared token per user, stored in the DB and checked on each incoming request. Nothing fancy.

---

## Component 3: Web App

**Tech:** Vite, React, Tailwind, JS-only, no TypeScript

**Data sources:**
1. **Task list**: fetched from the OSRS wiki MediaWiki API, parsed from wikitext. Currently Raging Echoes; swapped to Demonic Pacts on launch day. This data is stateless and can be fetched/cached at build time or on page load.
2. **Player state**: fetched from your own API (`/api/player/:username`)

**Core views:**

*Task list view*
- Input: username(s) to view
- Shows all tasks, filterable by: region (only show unlocked regions), completion status, tier/point value
- Defaults to: incomplete tasks in unlocked regions, sorted by point value descending

*Suggestion view* — the "what should I do next" panel
- Phase 1 (buildable now): highest-point incomplete tasks in unlocked regions
- Phase 2 (add later): skill-level awareness — cross-reference task skill requirements from the wiki against the player's current levels from the Leagues hiscores API, surface tasks the player is close to meeting requirements for
- Phase 3 (future): geographic clustering, once coordinate data is available

*Group/friends view*
- Shows multiple players' completion state side by side
- "Tasks none of us have done yet" / "tasks someone has done that could help others"

**Task data flexibility:**
The task list parsing should be isolated in a single module with a clear interface. When Leagues VI drops and the new wiki page exists, swapping the data source is a one-line URL change. The app should never assume specific task names or IDs are stable across leagues.

---

## Sequencing / What To Build When

**Now (before April 15):**
1. Set up RuneLite plugin project, get it compiling and running in dev mode
2. Build the full plugin architecture with stubbed varbit data — HTTP push works end-to-end, just with no real tasks yet
3. Build the API with schema and all endpoints
4. Build the web app with Raging Echoes task list — get filtering, sorting, and suggestion logic feeling good
5. Wire up the social/group view

**April 15 (launch day):**
1. Pull real `taskVarps` and region varbits from `task-json-store` (or inspect them via RuneLite DevTools if they're not in the store yet)
2. Slot into plugin, verify end-to-end push works with real completions
3. Swap task list URL to the new Demonic Pacts wiki page once it's populated

**Later:**
- Skill-level suggestion logic (pull from Leagues hiscores API)
- Geographic clustering (pending data availability)
- WebSockets for real-time group updates if polling feels too slow

---

## Open Questions To Revisit

- **Task name resolution**: task names live in the game cache structs, not in the JSON data store. The wiki task list has names as plain text. You'll need to decide whether the plugin pushes task IDs only (and the web app maps them to names via the wiki list), or whether the plugin also resolves names from the struct cache and includes them in the push. IDs-only is simpler and more robust.
- **Auth token distribution**: how do you want to handle getting tokens to your friends? Manual is fine for a small group.
- **Real-time vs polling**: how often does the web app poll `/api/player/:username`? Every 30 seconds is probably fine for a group of friends. Revisit if it feels stale.
