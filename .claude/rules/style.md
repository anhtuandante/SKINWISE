# Style & Code Convention Rules

## TypeScript / React

### File Organization
- One component per file, filename matches component name (PascalCase)
- Page files are always `page.tsx` under Next.js App Router structure
- Shared utilities go in `src/lib/`, shared constants in `src/lib/constants.ts`
- Types/interfaces go in `src/types/index.ts` (re-export from modules when needed)

### Naming Conventions
```
Components:       PascalCase       → ProductCard.tsx, RoutineBuilder.tsx
Pages:            page.tsx         → app/quiz/page.tsx (Next.js convention)
Hooks:            camelCase        → useUserStore, useRoutineStore
Utilities:        camelCase        → formatPrice, checkConflicts
Constants:        UPPER_SNAKE      → SKIN_LABELS, MAX_PRODUCTS
Interfaces:       PascalCase       → Product, UserProfile, ConflictWarning
File names:       kebab-case       → conflict-checker.ts, quiz-logic.ts
CSS classes:      Tailwind only    → No custom CSS class names unless in globals.css
```

### Import Order
```typescript
// 1. React/Next.js builtins
import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// 2. External libraries
import { create } from "zustand"
import { ArrowLeft, Check } from "lucide-react"

// 3. Internal — stores, lib, types
import { useUserStore } from "@/store/user-store"
import { filterProducts } from "@/lib/quiz-logic"
import { Product, ConflictWarning } from "@/types"

// 4. Internal — components
import ProductCard from "@/components/routine/ProductCard"
```

### Tailwind CSS Conventions
- Use design tokens from `tailwind.config.ts`: `sage`, `ink`, `surface`, `line`
- Follow size scale: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`
- Standard spacing: `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`
- Transitions: `transition-all duration-150` for interactions
- Hover states: darken (`hover:bg-zinc-50`), scale (`active:scale-[0.98]`), border (`hover:border-zinc-950/20`)
- Never use raw hex values in className — always Tailwind tokens

### Component Patterns
```tsx
// Always "use client" when using hooks/browser APIs
"use client"

// Props interface above component
interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  compact?: boolean
}

// Named default export
export default function ProductCard({ product, onAdd, compact }: ProductCardProps) {
  // Hooks at top
  // Derived state next
  // Event handlers
  // Early returns for variants (e.g., compact mode)
  // Main JSX return
}
```

## Vietnamese Content Guidelines
- All user-facing text in Vietnamese (tiếng Việt)
- Use proper diacritical marks (dấu): Ă, Â, Ê, Ô, Ơ, Ư, Đ etc.
- Currency format: `285.000 ₫` (use Intl.NumberFormat with "vi-VN" locale)
- Keep code comments in English for international collaboration
- Label mapping objects (SKIN_LABELS, etc.) bridge internal IDs to Vietnamese display text

## File Size Guidelines
- Components: < 200 lines. Split if larger.
- Pages: < 300 lines. Extract sections into components.
- Library functions: < 150 lines per file.
- JSON data files: No strict limit, but keep products.json under 50 items for demo.
