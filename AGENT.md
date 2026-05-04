# Project summary for AI agents

This summary helps you start work quickly without reading every file. It
reflects the codebase as of May 5, 2026.

## 1) Product snapshot

This project is a modular learning platform with gamification and admin tools.

Key features:
- Sequential learning modules with content and questions
- Hearts and XP systems
- Per-module user progress tracking
- Admin panel for CRUD modules and items
- Tutor chatbot on module pages (OpenRouter, SSE streaming)
- AI grading for short and long essay answers
- Module icon support for lists and cards

## 2) Core stack

The stack is modern Next.js with a SQLite backend and OpenRouter integration.

- Next.js App Router (`next@16`)
- React 19 with TypeScript
- Tailwind CSS 4, shadcn/ui, and Radix UI
- SQLite (`better-sqlite3`) with Drizzle ORM
- NextAuth Credentials (JWT session)
- Markdown rendering (`react-markdown` and `remark-gfm`)

## 3) Run and build commands

Use these commands for the standard workflow:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
npm run build
npm run lint
```

## 4) Runtime and database facts

The app uses SQLite with Drizzle and a push-based migration workflow.

- Active SQLite database: `english_app.db`
- Drizzle schema: `lib/db/schema.ts`
- DB driver: `lib/db/index.ts`
- Migration workflow: `drizzle-kit push`

Important note:
- `.env.example` uses `DB_URL=data.db`, but runtime uses `english_app.db`.

## 5) Authentication model

Authentication uses NextAuth with credentials and JWT sessions.

- Provider: Credentials
- Login: `username` and `password` (bcrypt compare)
- Session strategy: JWT
- Session includes `user.id` and `user.role`
- Roles: `admin`, `guru`, `murid`

Auth files:
- `lib/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`

## 6) High-level folder map

This map highlights the most relevant directories for feature work.

- `app/`: route pages and API routes
- `components/`: reusable UI, question types, module player, admin UI
- `lib/actions/`: server actions (modules, user-progress, users, upload)
- `lib/db/`: schema, DB bootstrap, seed
- `lib/chat/`: chat persistence helpers
- `drizzle/`: migration snapshots

## 7) Data model summary (tables)

These are the main tables and their responsibilities.

Core tables:
- `users`: account data, role, hearts, XP, streak
- `modules`: module metadata, icon key, publish state
- `module_items`: module content and questions
- `user_module_progress`: per-module progress
- `user_item_responses`: answers and AI grading fields

AI grading fields in `user_item_responses`:
- `aiScore`, `aiFeedback`, `aiReason`, `aiModel`, `aiGradedAt`

Chat tables:
- `chat_sessions`: per-user and per-module chat sessions
- `chat_messages`: message history with token usage and cost

## 8) Learning flow (student side)

The player loads module data, renders items, and saves progress frequently.

1. The module page checks the session.
2. It loads module data and items.
3. It renders `ModulePlayer`.
4. `ModulePlayer` updates hearts, XP, and progress periodically.
5. On answer submission, responses are saved to the DB.
6. For open-ended answers, AI grading runs and stores feedback and score.

Key files:
- `app/modules/[id]/page.tsx`
- `components/modules/module-player.tsx`
- `lib/actions/modules.ts`
- `lib/actions/user-progress.ts`
- `lib/actions/grade-open-ended.ts`

## 9) Chatbot implementation summary

The chatbot is available only on module pages.

### UI

The chat UI is a floating button and a responsive sheet.

- Component: `components/modules/module-chatbot.tsx`
- Position: floating button in `ModulePlayer`
- Layout: bottom sheet on mobile, right sheet on desktop
- Rendering: Markdown with GFM
- Streaming: SSE parser for `/api/chat`

### API

The API validates auth, fetches context, and streams the response.

- Endpoint: `app/api/chat/route.ts`
- `GET /api/chat?moduleId=...`
  - Fetches latest session for a module
  - Returns message history for hydration
- `POST /api/chat`
  - Validates auth and module access
  - Stores user message
  - Calls OpenRouter with `stream: true`
  - Streams tokens back to the client
  - Stores assistant response on completion

### Memory behavior

The prompt uses only the most recent messages.

- No summarization
- Context window uses the last N messages
- `N` comes from `OPENROUTER_MEMORY_WINDOW`
- Range is clamped to `1..12`
- Default is `4`

### SSE events emitted from server

The server emits structured events for the client stream.

- `meta`: sessionId, model, memoryWindow
- `token`: assistant text chunks
- `finish`: finish reason
- `done`: upstream `[DONE]`
- `complete`: completion metadata
- `error`: structured error payload

## 10) Environment variables in active use

These variables are active and should be present in `.env`.

NextAuth:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

OpenRouter chatbot and grading:
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_MEMORY_WINDOW`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_APP_URL`

PocketBase media storage (optional):
- `POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`
- `POCKETBASE_MEDIA_COLLECTION`
- `POCKETBASE_FILE_FIELD`

Other:
- `NAME_PM2`
- `PORT`

## 11) Where to edit for common requests

Use these pointers to find the right files quickly.

Add or change question types:
- Renderer: `components/modules/module-player.tsx`
- Admin editors: `components/admin/modules/...`
- Type registry: `components/admin/modules/item-types/index.ts`

Change scoring or progress logic:
- `lib/actions/user-progress.ts`
- `components/modules/module-player.tsx`

Change AI grading behavior:
- `lib/actions/grade-open-ended.ts`
- `components/modules/module-player.tsx`
- `lib/actions/user-progress.ts`

Change media upload behavior:
- `lib/actions/upload-media.ts`
- `components/ui/media-uploader.tsx`

Change module icons:
- `lib/module-icons.ts`
- `components/admin/modules/module-icon-picker.tsx`

Change chatbot behavior:
- Backend prompt and SSE: `app/api/chat/route.ts`
- Chat persistence: `lib/chat/store.ts`
- UI chat: `components/modules/module-chatbot.tsx`

Change auth and role gating:
- `lib/auth.ts`
- Route guards in `app/**/page.tsx` and `app/api/**`

## 12) Known caveats for next agent

These issues are known and may affect development flow.

- The repo has legacy lint issues in unrelated files.
- Run `npm run db:push` after schema changes.
- Avoid renaming route variables to `module` in some pages due to Next.js
  lint rules.
- YouTube embeds may still show a login wall. `youtube-nocookie.com` does not
  bypass restricted videos.
- PocketBase uploads require a file field that allows both image and video
  MIME types.

## 13) Fast-start checklist for next AI agent

Use this checklist to validate changes quickly.

1. Read this summary.
2. Confirm the target area in section 11.
3. Run `npm run build` as the minimum check.
4. If you change the schema, run `npm run db:push`, then build again.
5. If you change chat UI, test module pages on desktop and mobile.
6. If you change grading, ensure `OPENROUTER_API_KEY` is set.
