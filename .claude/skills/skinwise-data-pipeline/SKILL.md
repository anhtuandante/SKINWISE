---
name: skinwise-data-pipeline
description: Validate, expand, and maintain SkinWise product/ingredient/conflict datasets. Ensures referential integrity, detects orphan references, and generates data quality reports.
---

# SkinWise Data Pipeline Skill

## Overview
This skill validates and maintains the SkinWise data ecosystem:
- `src/data/products.json` — Product catalog
- `src/data/ingredients.json` — Ingredient encyclopedia
- `src/data/conflicts.json` — Conflict rules

## Data Validation Rules

### Referential Integrity Checks
1. Every `ingredient` ID in `products.json` → MUST exist in `ingredients.json`
2. Every `pair` item in `conflicts.json.ingredientConflicts` → MUST exist in `ingredients.json`
3. Every `category` in `products.json` → MUST be in `conflicts.json.layeringOrder`
4. Every `texture` in `products.json` → SHOULD be in `conflicts.json.textureOrder`

### Data Quality Checks
1. No duplicate product IDs
2. No duplicate ingredient IDs
3. `price` must be positive integer (VNĐ, no decimals)
4. `skinTypes` must use valid values: oily, dry, combination, normal, sensitive, all
5. `concerns` must use valid values: acne, pores, dark-spots, aging, dullness, dryness
6. `shopeeUrl` must start with `https://shopee.vn/`
7. `spf` field should only exist on sunscreen products

## Usage

### Validate Current Data
Run the validation script:
```bash
python .claude/skills/skinwise-data-pipeline/scripts/validate_data.py
```

### Add New Product
1. Add entry to `products.json` following `Product` interface
2. Ensure `ingredients` array references valid IDs
3. Run validation script
4. Check if new ingredients need to be added to `ingredients.json`
5. Check if new conflict rules are needed in `conflicts.json`

### Add New Ingredient
1. Add entry to `ingredients.json` following `Ingredient` interface
2. Update `conflictsWith` field on related ingredients
3. Add conflict rules to `conflicts.json` if applicable
4. Run validation script

## Scripts
- `scripts/validate_data.py` — Full validation suite
- `scripts/data_report.py` — Generate data quality report (coverage, orphans, stats)
