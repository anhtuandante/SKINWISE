# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SkinWise** is an AI-driven personalized skincare & makeup recommendation app for Vietnamese women (18–35). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), and Google Gemini AI.

**Production URL:** https://skinwise.vn

## Dev Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

No test runner is currently configured.

## Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript 5
- **Styling:** Tailwind CSS with a warm monochrome luxury-beauty design system (defined in `tailwind.config.ts`)
- **State:** Zustand 5 (with `persist` middleware → localStorage)
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **AI:** Google Gemini 1.5 Flash — chat via `@google/generative-ai` (streaming), vision via `@ai-sdk/google` + `ai` SDK v6
- **DnD:** `@dnd-kit/core` + `@dnd-kit/sortable` for routine reordering
- **Fonts:** Be Vietnam Pro (Vietnamese-optimized)

### Path Alias
`@/*` maps to `./src/*` (defined in `tsconfig.json`).

### Data Flow

```
/quiz → user-store (Zustand, persisted: skinType, concerns, budget, allergies)
         ↓
/results → filterProducts() [src/lib/quiz-logic.ts]
             ↓ async
           Supabase /products table → client-side filter/sort → ProductCard grid
             ↓
           Add to routine (AM/PM) → routine-store (Zustand, persisted, max 5 each)
             ↓
           checkConflicts() [src/lib/conflict-checker.ts] → ConflictWarnings

/api/chat (POST) → Gemini streaming chat; SYSTEM_PROMPT injects conflict rules + user context
/api/vision/analyze (POST) → Gemini Vision face-scan → returns skinType + concerns → auto-fills user-store
/api/products/score (POST) → Gemini scores product-user compatibility → displayed on ProductCard
```

### Known Asymmetry
`src/lib/conflict-checker.ts` reads from `src/data/conflicts.json` (local JSON) — it does NOT query the Supabase `rules` table. This is intentional from the MVP migration.

### Local JSON Still in Use
The `/ingredients` page directly reads `src/data/ingredients.json` (client-side) rather than fetching from Supabase. This bypasses the `ingredients` table.

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (heavy framer-motion animations)
│   ├── layout.tsx          # Root layout (fonts, analytics, AIChatPanel, ToastContainer)
│   ├── quiz/               # 4-step quiz (skin type → concerns → budget → allergies)
│   ├── results/            # Product grid + RoutineBuilder
│   ├── ingredients/        # Ingredient encyclopedia
│   └── api/                # API routes: chat, vision/analyze, products/score
├── components/
│   ├── ui/                 # Shared primitives: Button, Card, Badge, Skeleton, Toast, etc.
│   ├── chat/AIChatPanel.tsx        # Floating AI advisor (Gemini streaming)
│   ├── quiz/VisionLab.tsx          # AI face-scan modal (Gemini Vision)
│   └── routine/
│       ├── ProductCard.tsx         # Product card with AI match score badge
│       └── RoutineBuilder.tsx      # AM/PM DnD sortable routine
├── lib/
│   ├── supabase.ts         # Supabase client singleton + DbProduct/DbIngredient types
│   ├── quiz-logic.ts       # filterProducts() async → Supabase fetch + client-side scoring
│   ├── conflict-checker.ts # checkConflicts(), getSortedRoutine(), getMissingCategories()
│   ├── constants.ts        # Vietnamese labels, quiz options, category labels
│   ├── utils.ts            # cn() (clsx + twMerge)
│   └── ai/prompts.ts       # SYSTEM_PROMPT for Gemini AI advisor
├── store/                  # Zustand stores (all persisted to localStorage)
│   ├── user-store.ts       # Skin profile from quiz
│   ├── routine-store.ts    # AM/PM routines (max 5 products each)
│   └── toast-store.ts      # Ephemeral toast notifications
├── data/                   # Local JSON datasets (legacy, conflicts.json still actively used)
│   ├── products.json
│   ├── ingredients.json
│   └── conflicts.json
└── types/index.ts          # Product, Ingredient, ConflictWarning, UserProfile interfaces
```

## Supabase Schema

4 tables (read-all, write-admin-only via RLS):
- **`products`** — name, brand, price, category, skin_types[], concerns[], texture, is_silicone_based, is_water_based, shopee_url, image, etc.
- **`ingredients`** — name, name_vi, category, benefits[], skin_types[], conflicts_with[], etc.
- **`product_ingredients`** — many-to-many join table
- **`rules`** — conflict rules (NOT used by conflict-checker.ts — see Known Asymmetry above)

Schema defined in `supabase/schema.sql`.

## Design System

Warm monochrome luxury-beauty aesthetic via Tailwind custom tokens:

| Token | Value | Role |
|---|---|---|
| `accent` | `#C4A882` | Primary accent (warm sand) |
| `accent-dark` | `#8B7355` | Darker accent |
| `accent-light` | `#E8DDD0` | Light accent |
| `bg` | `#FAFAF8` | Page background |
| `fg` | `#1A1A1A` | Primary text |
| `danger` | `#D14D41` | Errors |
| `warning` | `#DA8B2D` | Medium severity |
| `success` | `#4A9C6D` | Confirmations |

Custom sizes: `display` (3.5rem), `headline` (2rem), `title` (1.25rem).

## Key Files to Know

- `src/app/layout.tsx` — root layout: mounts `AIChatPanel` + `ToastContainer` globally
- `src/lib/quiz-logic.ts` — `filterProducts()` is the main data-fetching function for results page
- `src/store/user-store.ts` — the single source of truth for the user's skin profile
- `src/components/routine/RoutineBuilder.tsx` — complex component with DnD + conflict checking
- `src/lib/ai/prompts.ts` — the system prompt used by the AI advisor; injects conflict data at request time

## Environment Variables

Required in `.env.local` (not committed):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` (server-side only, used in `/api/chat`)

## Claude Code Skills

Three skills are installed in `.agents/skills/`:
- **`skinwise-data-pipeline`** — validates JSON data files (products.json, ingredients.json, conflicts.json) referential integrity
- **`stitch-skinwise`** — integrates Google Stitch MCP for AI → React/Tailwind UI conversion
- **`supabase-postgres-best-practices`** — PostgreSQL reference (RLS, indexing, query optimization)

## Quirks

- `VisionLab.tsx` defines its own local `clsx()` helper instead of importing from `@/lib/utils` — inconsistent with the rest of the codebase.
- AI product scores are cached in `sessionStorage` keyed by `product.id + skinType`.
- `memory.md` (developer log) is written in Vietnamese.
