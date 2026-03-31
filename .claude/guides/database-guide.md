# SkinWise Deep Database — Technical Guide (v3.0)

This document outlines the professional-grade data layer implemented for SkinWise, focusing on advanced cosmetic compatibility and the 2024-2025 Vietnamese beauty market.

## 1. Data Schema Evolution
The `Product` interface now includes technical attributes used by the recommendation and conflict engine:
- `phValue`: Critical for determining the acidity of the product (e.g., Vitamin C at 3.0 vs Cleanser at 5.5).
- `isSiliconeBased`: Identifies products using Dimethicone/Cyclopentasiloxane as a primary base (common in primers, sunscreens, and matte foundations).
- `isWaterBased`: Identifies lightweight, water-driven formulas.
- `texture`: Categorized into Milk, Gel, Cream, Watery-Essence, Liquid, etc.

## 2. Professional Conflict Logic
Beyond simple ingredient pairs, the system now detects **Texture Incompatibility (Pilling/Vón cục)**:
- **The Rule**: Applying a Water-based product *after* a Silicone-based product creates a film barrier that leads to product "pilling" or "vón cục" on the skin.
- **Implementation**: The system identifies the layering order (Cleanser → Toner → Serum → Moisturizer → Sunscreen → Makeup) and flags high-severity warnings if this rule is violated.

## 3. Product Research & Sourcing
The database includes 70+ products curated from:
- **E-commerce Leaders**: Top-selling Shopee Mall items from 2024 (Torriden, d'Alba, 3CE, Maybelline).
- **Localized Brands**: Specific focus on high-quality Vietnamese brands (Cocoon, Dermarium, M.O.I, Thorakao).
- **Technical Analysis**: Ingredient lists are cross-referenced with `incidecoder.com` and `skinsort.com` for accuracy.

## 4. Key Additions (v3.0)
- **Torriden Dive-In Serum**: The #1 hydrating serum in Korea/VN for 2024.
- **d'Alba First Spray Serum**: Premium antioxidant mist.
- **Anessa Perfect UV Milk (2025)**: Industry standard for high-protection sunscreen.
- **3CE Blur Water Tint**: Advanced water-to-blur lip technology.
- **SkinCeuticals C E Ferulic**: The gold standard in high-end antioxidant serums (4.2M VNĐ).

## 5. Usage for Humans
Human operators can add products to `products.json` following the new schema to maintain system intelligence. Ensure `isSiliconeBased` is set to `true` for matte foundations and silicone-based sunscreens.
