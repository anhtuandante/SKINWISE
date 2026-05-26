#!/usr/bin/env python3
"""
SkinWise Data Validator
Validates referential integrity across products.json, ingredients.json, and conflicts.json
"""

import json
import os
import sys

def load_json(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        return json.load(f)

def validate(data_dir):
    errors = []
    warnings = []
    
    products_data = load_json(os.path.join(data_dir, 'products.json'))
    ingredients_data = load_json(os.path.join(data_dir, 'ingredients.json'))
    conflicts_data = load_json(os.path.join(data_dir, 'conflicts.json'))
    
    products = products_data['products']
    ingredients = {i['id']: i for i in ingredients_data['ingredients']}
    
    valid_categories = set(conflicts_data['layeringOrder'])
    valid_textures = set(conflicts_data['textureOrder'])
    valid_skin_types = {'oily', 'dry', 'combination', 'normal', 'sensitive', 'all', 'acne-prone'}
    valid_concerns = {'acne', 'pores', 'dark-spots', 'aging', 'dullness', 'dryness', 'oiliness', 'sensitivity'}
    
    # Check product IDs
    product_ids = [p['id'] for p in products]
    if len(product_ids) != len(set(product_ids)):
        errors.append("DUPLICATE product IDs found!")
    
    # Check each product
    for p in products:
        pid = p['id']
        
        # Category check
        if p['category'] not in valid_categories:
            errors.append(f"Product '{pid}': invalid category '{p['category']}'")
        
        # Texture check
        if p.get('texture') and p['texture'] not in valid_textures:
            warnings.append(f"Product '{pid}': texture '{p['texture']}' not in textureOrder")
        
        # Ingredient reference check
        for ing_id in p.get('ingredients', []):
            if ing_id not in ingredients:
                warnings.append(f"Product '{pid}': ingredient '{ing_id}' not found in ingredients.json")
        
        # Skin type check
        for st in p.get('skinTypes', []):
            if st not in valid_skin_types:
                warnings.append(f"Product '{pid}': invalid skinType '{st}'")
        
        # Price check
        if not isinstance(p.get('price'), int) or p['price'] <= 0:
            errors.append(f"Product '{pid}': price must be positive integer")
        
        # SPF check
        if p.get('spf') and p['category'] != 'sunscreen':
            warnings.append(f"Product '{pid}': has SPF but is not a sunscreen")
        
        # Shopee URL check
        if not p.get('shopeeUrl', '').startswith('https://shopee.vn/'):
            warnings.append(f"Product '{pid}': shopeeUrl doesn't start with https://shopee.vn/")
    
    # Check conflict references
    for conflict in conflicts_data.get('ingredientConflicts', []):
        for ing_id in conflict['pair']:
            if ing_id not in ingredients:
                errors.append(f"Conflict pair references unknown ingredient: '{ing_id}'")
    
    # Print report
    print(f"\n{'='*50}")
    print(f"SkinWise Data Validation Report")
    print(f"{'='*50}")
    print(f"Products: {len(products)}")
    print(f"Ingredients: {len(ingredients)}")
    print(f"Ingredient Conflicts: {len(conflicts_data.get('ingredientConflicts', []))}")
    print(f"Texture Conflicts: {len(conflicts_data.get('textureConflicts', []))}")
    print()
    
    if errors:
        print(f"❌ ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  • {e}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  • {w}")
    
    if not errors and not warnings:
        print("✅ All checks passed!")
    
    print()
    return len(errors) == 0

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate: scripts/ -> skinwise-data-pipeline/ -> skills/ -> .claude/ -> project root -> src/data
    data_dir = os.path.join(script_dir, '..', '..', '..', '..', 'src', 'data')
    data_dir = os.path.abspath(data_dir)
    
    if not os.path.exists(data_dir):
        print(f"Data directory not found: {data_dir}")
        sys.exit(1)
    
    success = validate(data_dir)
    sys.exit(0 if success else 1)
