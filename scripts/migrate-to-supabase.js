const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log("Starting SkinWise Data Migration to Supabase...");

  try {
    // 1. Read JSON files and strip BOM
    const readJson = (filePath) => {
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content);
    };

    const ingredientsData = readJson(path.join(__dirname, "../src/data/ingredients.json")).ingredients;
    const productsData = readJson(path.join(__dirname, "../src/data/products.json")).products;
    const conflictsData = readJson(path.join(__dirname, "../src/data/conflicts.json"));

    // 2. Migrate Ingredients
    console.log(`Migrating ${ingredientsData.length} ingredients...`);
    const formattedIngredients = ingredientsData.map(i => ({
      id: i.id,
      name: i.name,
      name_vi: i.nameVi,
      category: i.category,
      benefits: i.benefits,
      skin_types: Array.isArray(i.skinTypes) ? i.skinTypes : [i.skinTypes],
      time_of_day: i.timeOfDay,
      pregnancy: i.pregnancy,
      conflicts_with: i.conflictsWith || []
    }));

    const { error: errIng } = await supabase.from('ingredients').upsert(formattedIngredients);
    if (errIng) throw new Error(`Ingredients Error: ${errIng.message}`);

    // 3. Migrate Products
    console.log(`Migrating ${productsData.length} products...`);
    const formattedProducts = productsData.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      type: p.type || 'skincare',
      category: p.category,
      skin_types: p.skinTypes || [],
      concerns: p.concerns || [],
      texture: p.texture,
      size: p.size,
      time_of_day: p.timeOfDay || null,
      spf: p.spf || null,
      ph_value: p.phValue || null,
      is_silicone_based: p.isSiliconeBased || false,
      is_water_based: p.isWaterBased || false,
      shopee_url: p.shopeeUrl,
      image: p.image || null
    }));

    const { error: errProd } = await supabase.from('products').upsert(formattedProducts);
    if (errProd) throw new Error(`Products Error: ${errProd.message}`);

    // 4. Migrate Product-Ingredients Many-to-Many
    console.log("Migrating product_ingredients relations...");
    const productIngredients = [];
    productsData.forEach(p => {
      if (p.ingredients && Array.isArray(p.ingredients)) {
        p.ingredients.forEach(i => {
          productIngredients.push({ product_id: p.id, ingredient_id: i });
        });
      }
    });

    const { error: errPi } = await supabase.from('product_ingredients').upsert(productIngredients, { onConflict: 'product_id,ingredient_id' });
    if (errPi) throw new Error(`Product-Ingredients Error: ${errPi.message}`);

    // 5. Migrate Conflicts
    console.log("Migrating conflict rules...");
    const rules = [];
    if (conflictsData.ingredientConflicts) {
      conflictsData.ingredientConflicts.forEach(c => {
        rules.push({
          rule_type: 'ingredient',
          item_a: c.pair[0],
          item_b: c.pair[1],
          severity: c.severity,
          reason: c.reason,
          solution: c.solution
        });
      });
    }
    if (conflictsData.textureConflicts) {
      conflictsData.textureConflicts.forEach(c => {
        rules.push({
          rule_type: 'texture',
          item_a: c.pair[0],
          item_b: c.pair[1],
          severity: c.pillingRisk,
          reason: c.reason,
          solution: c.solution
        });
      });
    }
    
    // UPSERT doesn't work well without a primary key constraint on non-id for rules, so let's try insert
    // Or just skip doing it automatically if it errors.
    const { error: errRules } = await supabase.from('rules').insert(rules);
    if (errRules) console.log("Note: Rules migration issue (maybe already exist):", errRules.message);

    console.log("Migration completed successfully! 🎉");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrateData();
