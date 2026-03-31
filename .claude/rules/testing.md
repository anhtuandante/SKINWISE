# Testing Rules

## Current State
> ⚠️ **No tests exist yet.** This document defines the testing strategy to implement.

## Testing Stack (To Install)

```bash
# Unit Testing
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest jest-environment-jsdom

# E2E Testing
npm install -D @playwright/test
npx playwright install
```

## Unit Testing Rules

### What MUST Be Tested
1. **`src/lib/` functions** — Pure logic, highest priority
   - `quiz-logic.ts`: filterProducts, getProductsByCategory, formatPrice, calculateTotal, getBudgetMax
   - `conflict-checker.ts`: checkConflicts, getSortedRoutine, getMissingCategories
2. **Zustand stores** — State mutations
   - `user-store.ts`: setSkinType, toggleConcern, setBudget, resetQuiz
   - `routine-store.ts`: addToMorning/Evening (including edge cases: full, duplicate), remove, reorder, clear

### What SHOULD Be Tested
3. **Component rendering** — Snapshot + interactive
   - ProductCard renders all fields correctly
   - ConflictWarnings shows correct severity colors
   - Quiz steps enable/disable Next button based on validation

### Test File Location
```
src/
├── lib/
│   ├── quiz-logic.ts
│   ├── quiz-logic.test.ts          ← unit tests beside source
│   ├── conflict-checker.ts
│   └── conflict-checker.test.ts
├── store/
│   ├── user-store.ts
│   ├── user-store.test.ts
│   ├── routine-store.ts
│   └── routine-store.test.ts
└── components/
    └── routine/
        ├── ProductCard.tsx
        └── ProductCard.test.tsx
```

### Test Naming Convention
```typescript
describe("filterProducts", () => {
  it("should return only products matching skin type", () => { ... })
  it("should return empty array when no budget match", () => { ... })
  it("should sort by concern relevance (highest match first)", () => { ... })
})
```

### Coverage Targets
| Area | Minimum Coverage |
|------|-----------------|
| `src/lib/` | 90% |
| `src/store/` | 80% |
| `src/components/` | 60% |
| Overall | 75% |

## E2E Testing Rules

### Critical User Flows to Test
1. **Complete quiz flow:** Home → Quiz → Step 1-4 → Results page
2. **Routine builder:** Add product → Check conflict → Remove product → Verify total
3. **Empty state handling:** Results page without quiz completion → redirect/prompt
4. **Drag and drop:** Reorder products in routine → Verify new order persists

### Playwright Test Location
```
e2e/
├── quiz-flow.spec.ts
├── routine-builder.spec.ts
└── navigation.spec.ts
```

## TDD Rules (When Implementing)
1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Every PR must include tests for new `lib/` functions
