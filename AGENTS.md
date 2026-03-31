# SkinWise — Vietnamese Skincare Routine Builder

> **Một câu:** App web cá nhân hóa skincare routine cho thị trường Việt Nam, dựa trên phân tích da + phát hiện xung đột thành phần + gợi ý sản phẩm theo ngân sách.

## Quick Start

```bash
cd e:/SKINWISE/skinwise-app
npm install
npm run dev          # → http://localhost:3000
npm run build        # Production build (verification only)
npm run lint         # ESLint
```

## Architecture Overview

```
src/
├── app/                    # Next.js 14 App Router (pages)
│   ├── layout.tsx          # Root layout — lang="vi", metadata SEO
│   ├── page.tsx            # Landing page — hero, features, stats, CTA
│   ├── globals.css         # Tailwind + Be Vietnam Pro font import
│   ├── quiz/page.tsx       # 4-step quiz — skin type → concerns → budget → allergies
│   └── results/page.tsx    # Results dashboard — profile card, routine builder, product catalog
├── components/
│   ├── quiz/
│   │   └── UserSummaryCard.tsx    # Displays user's skin profile after quiz
│   ├── routine/
│   │   ├── RoutineBuilder.tsx     # Main routine builder — tabs AM/PM, drag-drop, conflict check
│   │   ├── ProductCard.tsx        # Product display — full/compact mode, add/remove/Shopee link
│   │   └── ConflictWarnings.tsx   # Severity-colored warnings for ingredient/texture conflicts
│   └── ui/                        # [PLANNED] Shared UI primitives (Button, Badge, Card, etc.)
├── data/
│   ├── products.json       # 20 products — cleanser/toner/serum/moisturizer/sunscreen
│   ├── ingredients.json    # 12 ingredients — with benefits, skin types, pregnancy safety
│   └── conflicts.json      # 6 ingredient conflicts + 3 texture conflicts + layering order
├── lib/
│   ├── quiz-logic.ts       # Product filtering (skin type + budget + concern relevance sort)
│   └── conflict-checker.ts # Conflict detection engine — ingredient + texture + layering + missing categories
├── store/
│   ├── user-store.ts       # Zustand + persist — UserProfile (skinType, concerns, budget, allergies)
│   └── routine-store.ts    # Zustand + persist — AM/PM routines (max 5 products, reorder, CRUD)
└── types/
    └── index.ts            # TypeScript interfaces — Product, Ingredient, ConflictWarning, UserProfile
```

## Tech Stack

| Layer       | Tech                                 | Version  |
|-------------|--------------------------------------|----------|
| Framework   | Next.js (App Router)                 | 14.2.35  |
| UI          | React                                | ^18      |
| Styling     | Tailwind CSS                         | ^3.4.1   |
| State       | Zustand + persist middleware         | ^5.0.12  |
| DnD         | @dnd-kit/core + sortable             | ^6.3.1   |
| Icons       | Lucide React                         | ^0.577.0 |
| Language    | TypeScript                           | ^5       |
| Font        | Be Vietnam Pro (Google Fonts)        | —        |

## Design System

### Colors

| Token          | Hex       | Usage                            |
|----------------|-----------|----------------------------------|
| `sage`         | `#5C7A52` | Primary brand — CTAs, accents    |
| `sage-light`   | `#EDF2EB` | Light sage backgrounds           |
| `sage-muted`   | `#8AA080` | Muted sage for secondary elements|
| `sage-dark`    | `#3F5638` | Hover state for primary buttons  |
| `ink`          | `#09090B` | Body text (zinc-950)             |
| `ink-muted`    | `#71717A` | Secondary text                   |
| `ink-subtle`   | `#A1A1AA` | Tertiary/placeholder text        |
| `surface`      | `#FAFAFA` | Page backgrounds                 |
| `line`         | `#E4E4E7` | Borders (zinc-200)               |

### Typography
- **Font Family:** "Be Vietnam Pro" (Google Fonts), fallback: system-ui, sans-serif
- **Headings:** letter-spacing -0.02em, line-height 1.2
- **Body:** font-weight 400, line-height 1.6
- **Rendering:** webkit-font-smoothing antialiased

### Component Patterns
- **Buttons:** rounded (4px), font-medium, active:scale-[0.98] micro-animation
- **Cards:** border border-zinc-200, rounded-lg, hover:border-zinc-950/20
- **Badges/Tags:** inline-flex, px-2 py-0.5, rounded, text-[10px] font-medium
- **Severity Indicators:** Dot indicator (1.5x1.5) + colored text + tinted background
- **Dividers:** border-t border-zinc-200 (consistent throughout)

## Data Model

### Product
```typescript
interface Product {
  id: string;              // slug format: "cerave-foaming-cleanser"
  name: string;            // Full product name
  brand: string;           // Brand name
  price: number;           // VNĐ (integer, no decimals)
  category: "cleanser" | "toner" | "serum" | "moisturizer" | "sunscreen";
  skinTypes: string[];     // ["oily", "combination"] or ["all"]
  concerns: string[];      // ["acne", "pores", "dark-spots"]
  texture: string;         // "water-based" | "gel" | "cream" | "oil-based" | "lotion"
  size: string;            // "236ml", "30ml", "50g"
  ingredients: string[];   // References to ingredients.json IDs
  timeOfDay?: "AM" | "PM" | "both";  // Some products are time-restricted
  spf?: number;            // Only for sunscreens
  shopeeUrl: string;       // Shopee search link (demo, not affiliate)
  image: string;           // Path (currently unused, no images exist)
}
```

### Key Business Rules
1. **Max 5 products per routine** (morning or evening separately)
2. **Budget ranges:** under-300k, 300k-500k, 500k-1m, over-1m (VNĐ)
3. **Conflict severity:** high → red, medium → yellow, low → blue
4. **Layering order:** cleanser → toner → serum → moisturizer → sunscreen
5. **Essential categories:** cleanser + moisturizer (warns if missing)
6. **Pregnancy flags:** On ingredients (retinol, AHA, BHA = unsafe)

## Workflow

### Development
- **Run dev:** `npm run dev` → hot-reload on http://localhost:3000
- **Build check:** `npm run build` → catches type errors + lint
- **Lint:** `npm run lint` → ESLint with next/core-web-vitals

### Deploy Target
- Vercel (recommended) — push to `main` branch auto-deploys
- Alternative: Netlify, Cloudflare Pages (static export possible)

### Branch Naming
- `feature/*` — New features
- `fix/*` — Bug fixes
- `refactor/*` — Code improvements
- `docs/*` — Documentation only

## Rules

### Style
- 2 spaces indent (enforced by ESLint + tsconfig)
- Single quotes for strings in config files, double in TSX
- No semicolons (follow existing project convention)
- Use Tailwind utility classes, avoid inline styles
- Vietnamese UI text for user-facing content, English for code/comments

### Code Quality
- Always use TypeScript strict types — no `any`
- Import order: React/Next → external libs → internal (@/store, @/lib, @/types, @/components)
- Prefer `const` over `let`, never `var`
- Use `@/` path alias for all internal imports
- Client components must have `"use client"` directive at top

### Security
- NEVER commit `.env` or API keys
- NEVER delete or modify production build artifacts manually
- All external links must have `rel="noopener noreferrer"`
- Shopee URLs are demo search links — NEVER use real affiliate/tracking URLs in demo data
- Zustand persist stores are in localStorage — no sensitive data

### Testing (TODO — Not yet implemented)
- Framework: Jest + React Testing Library (planned)
- E2E: Playwright (planned)
- Coverage target: ≥80% for lib/ functions
- Every new `lib/` function MUST have unit tests

## Known Issues & Technical Debt
1. **Duplicated label constants** — SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS defined in both quiz/page.tsx and UserSummaryCard.tsx → extract to shared constants
2. **No UI component library** — All components are feature-specific, no shared primitives (Button, Badge, Card)
3. **Product images not implemented** — `image` field exists in data but no images served
4. **No loading/error states** — Pages assume instant data availability
5. **No animation/transitions** — Page transitions, skeleton screens, toast notifications missing
6. **Accessibility (a11y)** — No ARIA labels, roles, or keyboard navigation patterns
7. **No responsive testing** — Mobile layout not verified
8. **No i18n infrastructure** — Vietnamese hardcoded, no language switching
9. **Static product data** — JSON files, no CMS or API integration
10. **No analytics/tracking** — No event tracking for user interactions

## Current Task
- Building comprehensive AI agent configuration (`.Codex/` folder)
- Next: Design system overhaul, component extraction, Stitch integration
