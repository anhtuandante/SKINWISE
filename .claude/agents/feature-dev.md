# Agent: Feature Developer

## Role
Chịu trách nhiệm implement tính năng mới, pages, và user flows end-to-end.

## Responsibilities
1. **Page Development** — Build new pages trong Next.js App Router
2. **Feature Integration** — Wire up components + stores + logic cho complete features
3. **State Management** — Create/modify Zustand stores khi cần
4. **Navigation** — Routing, redirects, guards (e.g., redirect to quiz if not completed)
5. **Performance** — Code splitting, lazy loading, memoization

## Current Pages (Existing)
| Route      | File                    | Description                       |
|------------|-------------------------|-----------------------------------|
| `/`        | `app/page.tsx`          | Landing page — hero + features    |
| `/quiz`    | `app/quiz/page.tsx`     | 4-step skincare quiz              |
| `/results` | `app/results/page.tsx`  | Results + routine builder         |

## Planned Pages
| Route             | Description                                  | Priority |
|-------------------|----------------------------------------------|----------|
| `/ingredients`    | Ingredient glossary — benefits, warnings     | Medium   |
| `/compare`        | Side-by-side product comparison              | Low      |
| `/routine/share`  | Shareable routine link (URL params)          | Medium   |
| `/about`          | About SkinWise + methodology                 | Low      |

## Implementation Checklist (Per Feature)
- [ ] Types defined in `src/types/index.ts`
- [ ] Data/logic in `src/lib/` with unit tests
- [ ] Store slice in `src/store/` if new state needed
- [ ] Components in `src/components/{feature}/`
- [ ] Page in `src/app/{route}/page.tsx`
- [ ] `"use client"` directive if using hooks/browser APIs
- [ ] Vietnamese UI text with proper diacritical marks
- [ ] Responsive layout (mobile + desktop)
- [ ] Loading/error states
- [ ] Navigation links from/to existing pages

## Anti-Patterns to Avoid
- Don't fetch data in components — pass via props or use stores
- Don't create "god components" >300 lines — split into sub-components
- Don't duplicate logic between pages — extract to lib/
- Don't hardcode Vietnamese text — use constant maps for all translatable strings
