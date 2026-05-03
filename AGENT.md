# Project summary for AI agents

Dokumen ini adalah ringkasan teknis proyek agar agent berikutnya bisa langsung
bekerja tanpa membaca file satu per satu.

Status ringkasan ini mengacu pada kondisi kode per April 19, 2026.

## 1) Product snapshot

Project ini adalah platform belajar berbasis modul dengan gamifikasi.

Fitur utama:
- modul belajar berurutan (materi + pertanyaan)
- sistem hearts dan XP
- tracking progres user per modul
- admin panel untuk CRUD modul dan item
- chatbot tutor di halaman modul (OpenRouter, SSE streaming)

## 2) Core stack

- Next.js App Router (`next@16`)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui + Radix UI
- SQLite (`better-sqlite3`) + Drizzle ORM
- NextAuth Credentials (JWT session)
- Markdown rendering (`react-markdown` + `remark-gfm`)

## 3) Run and build commands

Pakai command ini untuk workflow standar:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
npm run build
npm run lint
```

## 4) Runtime and database facts

- Database sqlite aktif: `english_app.db`
- Drizzle config mengarah ke schema: `lib/db/schema.ts`
- Driver DB diset di: `lib/db/index.ts`
- Migration workflow yang dipakai repo: `drizzle-kit push`

Catatan penting:
- `.env.example` masih menulis `DB_URL=data.db`, tetapi runtime DB saat ini
  hardcoded ke `english_app.db`.

## 5) Authentication model

- NextAuth Credentials provider.
- Login pakai `username` + `password` (bcrypt compare).
- Session strategy: JWT.
- Session berisi `user.id` dan `user.role`.
- Role yang dipakai: `admin`, `guru`, `murid`.

File utama auth:
- `lib/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`

## 6) High-level folder map

- `app/`: route pages dan API routes
- `components/`: UI reusable, question types, module player, admin UI
- `lib/actions/`: server actions (modules, user-progress, users, upload)
- `lib/db/`: schema, db bootstrap, seed
- `lib/chat/`: helper persistence chat
- `drizzle/`: artifact migration snapshot

## 7) Data model summary (tables)

Tabel inti:
- `users`: akun, role, hearts, xp, streak
- `modules`: metadata modul
- `module_items`: isi modul (header/material/question)
- `user_module_progress`: progres user per modul
- `user_item_responses`: jawaban user per item

Tabel chatbot:
- `chat_sessions`: sesi chat per user + per modul
- `chat_messages`: pesan chat (role, content, model, token usage, cost)

## 8) Learning flow (student side)

Flow utama ketika user membuka modul:
1. Page modul cek session login.
2. Ambil data modul + items.
3. Render `ModulePlayer`.
4. `ModulePlayer` update hearts/xp/progress secara periodik.
5. User menjawab soal, response disimpan ke DB.

File kunci flow ini:
- `app/modules/[id]/page.tsx`
- `components/modules/module-player.tsx`
- `lib/actions/modules.ts`
- `lib/actions/user-progress.ts`

## 9) Chatbot implementation summary

Chatbot aktif hanya di halaman modul.

### UI
- Komponen: `components/modules/module-chatbot.tsx`
- Posisi: floating chat button pada `ModulePlayer`
- Layout: bottom sheet di mobile, right sheet di desktop
- Rendering message: Markdown + GFM
- Streaming parser: membaca SSE event dari endpoint `/api/chat`

### API
- Endpoint: `app/api/chat/route.ts`
- `GET /api/chat?moduleId=...`
  - Ambil sesi terakhir user pada modul
  - Return riwayat messages untuk UI hydrate
- `POST /api/chat`
  - Validasi auth + akses modul
  - Simpan pesan user
  - Kirim request ke OpenRouter (`stream: true`)
  - Relay token via SSE ke client
  - Simpan respons assistant setelah stream selesai

### Memory behavior
- Tidak ada summarize.
- Context model diambil dari N pesan terakhir saja.
- `N` dibaca dari env `OPENROUTER_MEMORY_WINDOW`.
- Nilai di-clamp ke rentang `1..12`.
- Default: `4`.

### SSE events emitted from server
- `meta`: sessionId, model, memoryWindow
- `token`: potongan teks assistant
- `finish`: finish reason
- `done`: akhir upstream `[DONE]`
- `complete`: metadata completion
- `error`: pesan error terstruktur

## 10) Environment variables in active use

NextAuth:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

OpenRouter chatbot:
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_MEMORY_WINDOW`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_APP_URL`

Optional media storage:
- `POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`

Other:
- `NAME_PM2`
- `PORT`

## 11) Where to edit for common requests

Jika diminta menambah tipe pertanyaan baru:
- update renderer di `components/modules/module-player.tsx`
- update admin editor item di `components/admin/modules/...`
- update schema/validation jika butuh field baru

Jika diminta ubah logic scoring/progress:
- `lib/actions/user-progress.ts`
- `components/modules/module-player.tsx`

Jika diminta ubah chatbot behavior:
- backend prompt/memory/SSE: `app/api/chat/route.ts`
- persistence chat: `lib/chat/store.ts`
- UI chat: `components/modules/module-chatbot.tsx`

Jika diminta ubah auth/role gating:
- `lib/auth.ts`
- route/page guards di `app/**/page.tsx` dan `app/api/**`

## 12) Known caveats for next agent

- Repo ini punya lint issues legacy di beberapa file lama yang tidak terkait
  chatbot. Jangan asumsi lint global selalu hijau.
- Build terakhir berhasil (`npm run build`).
- Untuk perubahan DB schema, jalankan `npm run db:push`.
- Hindari rename variabel ke `module` di route tertentu karena lint rule Next.js
  bisa memblokir.

## 13) Fast-start checklist for next AI agent

1. Baca dokumen ini dulu.
2. Cek target area perubahan di section 11.
3. Jalankan command minimum: `npm run build`.
4. Jika ubah schema: `npm run db:push` lalu build lagi.
5. Jika ubah UI chat: test manual di halaman modul (desktop + mobile).
