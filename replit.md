# Math Mind Mentor — Workspace

## Overview

**MathMind AI Mentor** — A full-stack AI-powered EdTech platform (Math-Mind-Mentor) built with a pnpm monorepo. Features adaptive learning paths, multilingual AI tutor (8 languages), practice sessions, misconception detection, confidence scoring, multiplayer math battles, course marketplace with comparison, gamification (XP, badges, streaks), and smart analytics.

## Public Assets (`artifacts/mathtutor/public/assets/`)

All assets extracted from the project zip:
- `hero.gif`, `hero2.gif`, `hero3.gif`, `hero4.gif` — Animated hero images (landing page rotating carousel)
- `alex_walk.gif` — Walking mascot animation
- `logo.png` — App logo (used in header/sidebar)
- `fire.png` — Streak indicator icon
- `star.png` — XP/level indicator icon
- `badge.png` — Achievement badge icon
- `book.png`, `books.png` — Learning/library icons
- `game.png` — Battle/gamification icon
- `globe.svg` — Language/globe icon
- `growth.png` — Progress/analytics icon
- `tree.png` — Knowledge map/skill tree icon
- `machine.webp` — AI/robot illustration
- `course-banner.gif` — Course marketplace banner
- `start-up.png` — Social/community icon
- `mail.png` — Notifications icon

## Multilingual Support (8 Languages)

Supported languages defined in `artifacts/mathtutor/src/lib/i18n.ts`:
- `en` — English
- `hi` — Hindi (हिन्दी)
- `bn` — Bengali (বাংলা)
- `ta` — Tamil (தமிழ்)
- `te` — Telugu (తెలుగు)
- `mr` — Marathi (मराठी)
- `pa` — Punjabi (ਪੰਜਾਬੀ)
- `gu` — Gujarati (ગુજરાતી)

AI system prompts for all 8 languages are in `artifacts/api-server/src/routes/openai-tutor.ts`. Each prompt includes English technical term bridging for non-English users.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `mathtutor`)
- **API framework**: Express 5 (artifact: `api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (api-zod), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Artifacts

- `artifacts/mathtutor` — React/Vite frontend (port: 19626, previewPath: `/`)
- `artifacts/api-server` — Express API server (port: 8080, previewPath: `/api`)

## Lib Packages

- `lib/api-spec` — OpenAPI spec + orval codegen config
- `lib/api-zod` — Generated Zod schemas for validation
- `lib/api-client-react` — Generated React Query hooks for frontend
- `lib/db` — PostgreSQL schema (Drizzle ORM) + seed
- `lib/integrations-openai-ai-server` — OpenAI client (server-side)
- `lib/integrations-openai-ai-react` — OpenAI hooks (React)

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema to DB
- `node --import ./node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/esm/index.cjs lib/db/src/seed.ts` — seed subjects, topics, questions
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run API server locally
- `PORT=19626 BASE_PATH=/ pnpm --filter @workspace/mathtutor run dev` — run frontend locally

## Workflow

The "Start application" workflow runs both services together:
```
PORT=19626 BASE_PATH=/ pnpm --filter @workspace/mathtutor run dev & PORT=8080 pnpm --filter @workspace/api-server run dev
```

## Pages (mathtutor)

- `/` — Landing page
- `/login`, `/register` — Auth
- `/dashboard` — Stats overview
- `/practice` — Subject/topic picker
- `/practice/:topicId` — Practice session
- `/tutor` — AI tutor conversation list
- `/tutor/:conversationId` — Chat with AI tutor (streaming)
- `/battle` — Battle lobby
- `/battle/:id` — Live battle arena
- `/leaderboard` — Global leaderboard
- `/friends` — Friend requests + list
- `/progress` — Progress charts
- `/badges` — Badge collection
- `/profile` — User profile

## API Routes (api-server)

- `GET/POST /api/auth/*` — Register, login, me
- `GET/PUT /api/users/:id` — User profile
- `GET /api/subjects`, `/api/subjects/:id/topics` — Subjects + topics
- `GET /api/questions`, `POST /api/questions/:id/submit`, `POST /api/questions/generate` — Practice
- `GET /api/progress`, `GET /api/progress/topics`, `GET /api/progress/accuracy` — Progress
- `GET /api/dashboard/summary`, `/recommendations`, `/activity` — Dashboard data
- `GET/POST /api/battles`, `/battles/:id/join`, `/battles/:id/submit` — Battles
- `GET/POST /api/friends/*` — Friends management
- `GET /api/notifications`, `PUT /api/notifications/:id/read` — Notifications
- `GET/POST/DELETE /api/openai/conversations/*` — AI Tutor chat

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — JWT secret
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy URL (auto-set via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-set via Replit AI Integrations)
