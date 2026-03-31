# SkinWise - Global Memory Scratchpad

> Facts va context quan trong can nho xuyen suot cac sessions.

## Project State (Last updated: 2026-03-23)

### Critical Facts
- Project path: `e:/SKINWISE/skinwise-app`
- Vietnamese-language app targeting the VN skincare and makeup market
- Font: Be Vietnam Pro via Google Fonts import in `src/app/globals.css`
- Current visual direction uses warm monochrome tokens in `tailwind.config.ts` (`bg`, `fg`, `surface`, `accent`) rather than the older sage palette docs
- All prices are stored as integer VNĐ values and formatted with `Intl.NumberFormat("vi-VN")`
- Shopee URLs are demo search links only, never affiliate links
- Product images are still metadata-only; no real image assets are served yet
- No backend; app remains fully client-side with static JSON data plus Zustand persistence

### Zustand Store Keys
- `skinwise-user` -> localStorage key for quiz answers and quiz completion
- `skinwise-routine` -> localStorage key for morning/evening routine state

### Architecture Decisions Made
1. Next.js App Router is the active routing model
2. Zustand remains the state layer because the app is still small and local-first
3. `@dnd-kit` remains the drag-drop solution for routine ordering
4. Tailwind CSS is the source of truth for tokens and interaction styling

### Important Implementation Facts
- Shared copy and labels now live in `src/lib/constants.ts`; duplicated quiz labels have been consolidated
- `src/components/ui/` now exists with `Button.tsx`, `Badge.tsx`, and `Card.tsx`
- Loading skeleton routes now exist for `ingredients`, `quiz`, and `results`
- Results page now supports adding recommended products directly into the routine store
- `RoutineBuilder` uses `morningRoutine` and `eveningRoutine` from `src/store/routine-store.ts`
- `routine-store.ts` still returns `boolean` from `addToMorning` and `addToEvening` (`false` means duplicate or full)
- Ingredient and conflict datasets were cleaned up for Vietnamese readability and valid display text

### Known Quirks
- `quiz/page.tsx` still uses `useState(1)` for step tracking (1-indexed)
- Some project docs in `.Claude/` describe older project state and are not fully synchronized with the real codebase
- `conflict-checker.ts` still deserves extra review around texture edge cases with more than two products
- Product `image` fields point to paths that do not exist yet, so UI should not assume working image assets

### Quality Status
- `npm run build` passes after the latest refactor and UI cleanup
- Dev server was invoked, but no persistent long-running preview process was kept alive in-session
- Dependency `clsx` was added for UI composition

### Important: What NOT to Do
- Do NOT remove the `persist` middleware from Zustand stores
- Do NOT change ingredient IDs in `ingredients.json`; they are foreign keys used across product/conflict data
- Do NOT change the tuple shape in `conflicts.json` ingredient pairs
- Do NOT assume `.Claude` docs are always current; verify against `src/` before making structural changes
- Do NOT build UI around product images until actual assets are added

## Session Log
- **2026-03-22:** Created `.claude/` folder structure with documentation for multi-agent collaboration. Deep-dived the codebase and documented technical debt plus roadmap ideas.
- **2026-03-23:** Repaired widespread Vietnamese text encoding issues across app pages and data files. Added shared UI primitives in `src/components/ui/`, added route loading skeletons, improved results flow so recommended products can be added directly to AM/PM routines, and verified the app with `npm run build`.
