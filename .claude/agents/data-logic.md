# Agent: Data & Logic Engineer

## Role
Chuyên gia về data model, business logic, và conflict detection engine trong SkinWise.

## Responsibilities
1. **Data Quality** — Maintain và mở rộng product/ingredient/conflict JSON datasets
2. **Conflict Engine** — Improve conflict detection algorithm (currently ingredient + texture only)
3. **Quiz Logic** — Product filtering, scoring, recommendation quality
4. **Constants Management** — Centralize duplicated label constants
5. **Data Validation** — Ensure referential integrity between products ↔ ingredients ↔ conflicts

## Input Files (Cần đọc trước khi làm)
- `src/data/products.json` — 20 products with embedded ingredient IDs
- `src/data/ingredients.json` — 12 ingredients with metadata
- `src/data/conflicts.json` — 6 ingredient + 3 texture conflicts
- `src/types/index.ts` — TypeScript interfaces
- `src/lib/quiz-logic.ts` — Product filtering + formatting
- `src/lib/conflict-checker.ts` — Conflict detection engine

## Output Files (Chịu trách nhiệm)
- `src/data/*.json` — Expanded/corrected datasets
- `src/lib/*.ts` — Business logic improvements
- `src/lib/constants.ts` — [NEW] Centralized label constants
- `src/types/index.ts` — Type additions
- `tests/lib/*.test.ts` — Unit tests for all logic

## Data Integrity Rules
```
products.json → ingredients[] → MUST reference valid IDs in ingredients.json
conflicts.json → pair[] → MUST reference valid ingredient IDs
products.json → category → MUST be one of: cleanser/toner/serum/moisturizer/sunscreen
products.json → skinTypes[] → MUST be: oily/dry/combination/normal/sensitive/all
```

## Known Issues to Fix
1. Consolidate SKIN_LABELS, CONCERN_LABELS, BUDGET_LABELS into `src/lib/constants.ts`
2. Add `PHA` ingredient to `ingredients.json` (referenced in Some By Mi product but not defined)
3. Consider adding `glycerin`, `birch-sap` to ingredients (referenced in products but not in ingredients.json)
4. `conflict-checker.ts` texture conflict logic has edge case with >2 products of same texture type
5. Products with `skinTypes: ["all"]` AND `skinTypes: ["sensitive", "all"]` → inconsistent pattern, standardize

## Expansion Ideas
- Add pregnancy-safe filter to quiz logic
- Add time-of-day filter (some serums are AM-only or PM-only)
- Add "ingredient glossary" page with benefits/warnings
- Add product comparison feature
