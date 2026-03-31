#!/usr/bin/env python3
"""
SkinWise Data Coverage Report
Generates statistics about product/ingredient data coverage and gaps.
"""

import json
import os
from collections import Counter

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_report(data_dir):
    products = load_json(os.path.join(data_dir, 'products.json'))['products']
    ingredients = load_json(os.path.join(data_dir, 'ingredients.json'))['ingredients']
    conflicts = load_json(os.path.join(data_dir, 'conflicts.json'))
    
    # Category distribution
    categories = Counter(p['category'] for p in products)
    
    # Skin type coverage
    skin_types = Counter()
    for p in products:
        for st in p['skinTypes']:
            skin_types[st] += 1
    
    # Concern coverage
    concerns = Counter()
    for p in products:
        for c in p['concerns']:
            concerns[c] += 1
    
    # Price distribution
    prices = [p['price'] for p in products]
    budget_under_300k = sum(1 for p in prices if p < 300000)
    budget_300_500k = sum(1 for p in prices if 300000 <= p < 500000)
    budget_500k_1m = sum(1 for p in prices if 500000 <= p < 1000000)
    budget_over_1m = sum(1 for p in prices if p >= 1000000)
    
    # Ingredient usage
    ing_usage = Counter()
    all_product_ings = set()
    for p in products:
        for ing in p.get('ingredients', []):
            ing_usage[ing] += 1
            all_product_ings.add(ing)
    
    ing_ids = {i['id'] for i in ingredients}
    orphan_refs = all_product_ings - ing_ids
    unused_ings = ing_ids - all_product_ings
    
    # Report
    print(f"\n{'='*60}")
    print(f"SkinWise Data Coverage Report")
    print(f"{'='*60}\n")
    
    print(f"📦 Products: {len(products)}")
    for cat, count in sorted(categories.items()):
        bar = '█' * count
        print(f"   {cat:15s} {count:2d} {bar}")
    
    print(f"\n🧴 Ingredients: {len(ingredients)} defined, {len(all_product_ings)} used in products")
    if orphan_refs:
        print(f"   ⚠️  Orphan refs (in products, not in ingredients.json): {orphan_refs}")
    if unused_ings:
        print(f"   ℹ️  Unused (in ingredients.json, not in any product): {unused_ings}")
    
    print(f"\n💰 Price Distribution:")
    print(f"   Under 300k:  {budget_under_300k}")
    print(f"   300k-500k:   {budget_300_500k}")
    print(f"   500k-1M:     {budget_500k_1m}")
    print(f"   Over 1M:     {budget_over_1m}")
    print(f"   Range: {min(prices):,}đ - {max(prices):,}đ")
    
    print(f"\n🎯 Skin Type Coverage:")
    for st, count in sorted(skin_types.items(), key=lambda x: -x[1]):
        bar = '█' * count
        print(f"   {st:15s} {count:2d} {bar}")
    
    print(f"\n🔬 Concern Coverage:")
    for c, count in sorted(concerns.items(), key=lambda x: -x[1]):
        bar = '█' * count
        print(f"   {c:15s} {count:2d} {bar}")
    
    print(f"\n⚡ Conflicts: {len(conflicts.get('ingredientConflicts', []))} ingredient, {len(conflicts.get('textureConflicts', []))} texture")
    
    # Gap analysis
    print(f"\n📊 Gap Analysis:")
    gaps = []
    if categories.get('cleanser', 0) < 4: gaps.append("Need more cleansers")
    if categories.get('serum', 0) < 4: gaps.append("Need more serums")
    if budget_over_1m == 0: gaps.append("No premium tier (>1M VNĐ) products")
    if skin_types.get('sensitive', 0) < 3: gaps.append("Low coverage for sensitive skin")
    if concerns.get('aging', 0) < 3: gaps.append("Low coverage for anti-aging concern")
    
    if gaps:
        for g in gaps:
            print(f"   • {g}")
    else:
        print(f"   ✅ No major gaps detected")
    
    print()

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', '..', '..', '..', 'src', 'data')
    data_dir = os.path.abspath(data_dir)
    generate_report(data_dir)
