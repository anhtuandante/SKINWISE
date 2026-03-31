---
name: stitch-skinwise-design
description: Generate and iterate on SkinWise UI screens using Google Stitch MCP. Enhances prompts with SkinWise design system context, generates high-fidelity screens, and converts to React/Tailwind components.
---

# Stitch SkinWise Design Skill

## Overview
This skill integrates Google Stitch (AI-powered UI design tool) with the SkinWise project. It handles:
1. **Prompt Enhancement** — Enriches vague UI ideas with SkinWise design tokens, Vietnamese content context, and skincare-specific UX patterns
2. **Screen Generation** — Uses Stitch MCP to generate high-fidelity UI screens
3. **React Conversion** — Converts Stitch HTML output to React + Tailwind components following SkinWise conventions

## Prerequisites

### Install Stitch Skills
```bash
# Install the stitch-design skill globally
npx skills add google-labs-code/stitch-skills --skill stitch-design --global

# Install the react-components converter
npx skills add google-labs-code/stitch-skills --skill react:components --global

# Install the prompt enhancer
npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global

# Install the design-md generator
npx skills add google-labs-code/stitch-skills --skill design-md --global
```

### Required MCP Server
Stitch MCP server must be configured. See `.claude/settings.json` → `mcp_servers.stitch`.

## Workflow

### Step 1: Define Design Intent
Write your design intent in natural language. The skill will enhance it with SkinWise context.

**Example input:**
```
Design a product comparison page for SkinWise where users can compare 2-3 skincare products side by side
```

**Enhanced output by skill:**
```
Design a product comparison page for a Vietnamese skincare app.
- Color scheme: sage green (#5C7A52) primary, zinc grays for text hierarchy
- Font: Be Vietnam Pro, Vietnamese diacritical marks required
- Layout: Side-by-side comparison cards with ingredient lists, price in VNĐ, conflict indicators
- Aesthetic: Clean, minimalist, premium feel with subtle hover animations
- Mobile: Stack cards vertically on mobile, horizontal scroll on tablet
- Components: Sticky header with back navigation, comparison table with highlighted differences
```

### Step 2: Generate with Stitch
Use the Stitch MCP `generate_screen` tool with the enhanced prompt.

### Step 3: Convert to React
Use the `react-components` skill to convert Stitch HTML output to React + Tailwind components.

**Conversion rules specific to SkinWise:**
- Replace any hardcoded colors with Tailwind tokens from `tailwind.config.ts`
- Replace fonts with `font-sans` (maps to Be Vietnam Pro)
- Add `"use client"` directive if component uses any hooks
- Use Lucide React icons instead of SVG/inline icons
- Follow import order from `.claude/rules/style.md`
- Add Vietnamese text based on context (use constants from `src/lib/constants.ts`)

### Step 4: Integrate
Place generated components in the appropriate directory:
- `src/components/ui/` — Shared primitives (Button, Card, Badge)
- `src/components/{feature}/` — Feature-specific components
- `src/app/{route}/page.tsx` — Full page implementations

## SkinWise Design Context (For Prompt Enhancement)

### Brand Personality
- **Tone:** Chuyên nghiệp nhưng thân thiện (Professional yet friendly)
- **Target user:** Phụ nữ Việt Nam 18-35 tuổi quan tâm skincare
- **Feel:** Clean, trustworthy, science-backed, premium but accessible

### Design Tokens (Inject into all prompts)
```
PRIMARY: sage green #5C7A52 (nature, gentle, skincare)
SURFACE: white #FFFFFF / zinc-50 #FAFAFA
TEXT: zinc-950 #09090B (primary) / zinc-500 #71717A (secondary) / zinc-400 #A1A1AA (tertiary)
BORDER: zinc-200 #E4E4E7
ACCENT-DANGER: red-500 (high severity)
ACCENT-WARNING: yellow-500 (medium severity)  
ACCENT-INFO: blue-400 (low severity)
ROUNDED: rounded-lg (8px default)
SHADOW: none (flat design, use borders instead)
```

### UX Patterns to Apply
1. **Cards** — White bg, 1px zinc-200 border, rounded-lg, p-4, hover:border-zinc-950/20
2. **Buttons** — Primary: bg-sage text-white, rounded, active:scale-[0.98] | Secondary: border border-zinc-200, bg-white
3. **Badges** — px-2 py-0.5, rounded, text-[10px], font-medium, colored background + text
4. **Progress** — Horizontal bar dots (like quiz), zinc-200 inactive, zinc-950 active
5. **Severity** — Red/Yellow/Blue dot + tinted background + icon system
6. **Layout** — max-w-5xl mx-auto px-6, sticky header with backdrop-blur
7. **Typography** — h1: text-5xl font-bold, h2: text-2xl font-semibold, body: text-sm/text-base

## Example: Generate Ingredient Glossary Page

### Prompt
```
Generate an ingredient glossary page for SkinWise (Vietnamese skincare app):
- Grid of ingredient cards
- Each card shows: Vietnamese name, English name, category badge, benefits list, skin type compatibility, pregnancy safety indicator
- Search/filter by category (brightening, hydrating, exfoliant, soothing, barrier, acne-fighting)
- Click card to expand with detailed info
- SkinWise design system: sage green (#5C7A52) + zinc, Be Vietnam Pro font, clean minimalist
```

### Expected Output
A high-fidelity screen mockup that can be converted to a Next.js page at `src/app/ingredients/page.tsx`.
