-- SkinWise Database Schema (PostgreSQL)

-- 1. INGREDIENTS TABLE
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  category TEXT NOT NULL,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  skin_types TEXT[] NOT NULL DEFAULT '{}',
  time_of_day TEXT CHECK (time_of_day IN ('AM', 'PM', 'both')) NOT NULL,
  pregnancy BOOLEAN NOT NULL DEFAULT false,
  conflicts_with TEXT[] DEFAULT '{}'
);

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price INTEGER NOT NULL,
  type TEXT CHECK (type IN ('skincare', 'makeup')) NOT NULL,
  category TEXT NOT NULL,
  skin_types TEXT[] NOT NULL DEFAULT '{}',
  concerns TEXT[] NOT NULL DEFAULT '{}',
  texture TEXT NOT NULL,
  size TEXT NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('AM', 'PM', 'both', NULL)),
  spf INTEGER,
  ph_value NUMERIC,
  is_silicone_based BOOLEAN DEFAULT false,
  is_water_based BOOLEAN DEFAULT false,
  shopee_url TEXT NOT NULL,
  image TEXT
);

-- 3. PRODUCT_INGREDIENTS (Many-to-Many Relationship)
CREATE TABLE product_ingredients (
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

-- 4. CONFLICT RULES (For Category/Texture layering rules)
CREATE TABLE rules (
  id SERIAL PRIMARY KEY,
  rule_type TEXT CHECK (rule_type IN ('texture', 'layering', 'ingredient')) NOT NULL,
  item_a TEXT NOT NULL,
  item_b TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')) NOT NULL,
  reason TEXT NOT NULL,
  solution TEXT NOT NULL
);

-- INDEXES
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_product_ingredients_prod ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ing ON product_ingredients(ingredient_id);

-- SECURITY (RLS)
-- We only need READ access for anonymous users. Writing is done via Server/Admin.
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON product_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rules FOR SELECT USING (true);
