const fs = require("fs");
const path = require("path");

// Configuration
const PRODUCTS_JSON_PATH = path.join(__dirname, "../src/data/products.json");
const IMAGES_DIR = path.join(__dirname, "../public/images/products");
const DELAY_MS = 2500; // 2.5 seconds delay to prevent DDG rate limits

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Extract VQD token from DuckDuckGo search page
async function getVqd(query) {
  try {
    const response = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const text = await response.text();
    const match = text.match(/vqd=([\d-]+)&/);
    if (!match) {
      const match2 = text.match(/vqd=["']([\d-]+)["']/);
      return match2 ? match2[1] : null;
    }
    return match[1];
  } catch (err) {
    console.error(`Error getting VQD token for query "${query}":`, err.message);
    return null;
  }
}

// Search images on DuckDuckGo
async function searchImages(query) {
  try {
    const vqd = await getVqd(query);
    if (!vqd) return [];

    const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/"
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error(`Error searching images for query "${query}":`, err.message);
    return [];
  }
}

// Download image from URL and save to destination path
async function downloadImage(url, destPath) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    // console.log(`   └─ Failed to download from: ${url.substring(0, 60)}... (${err.message})`);
    return false;
  }
}

// Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== SkinWise Product Image Downloader ===");
  console.log(`Checking products from: ${PRODUCTS_JSON_PATH}`);
  console.log(`Saving images to: ${IMAGES_DIR}\n`);

  if (!fs.existsSync(PRODUCTS_JSON_PATH)) {
    console.error("Error: products.json not found!");
    process.exit(1);
  }

  const productsData = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, "utf8"));
  const products = productsData.products;
  const total = products.length;

  console.log(`Total products listed: ${total}`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < total; i++) {
    const product = products[i];
    const imageFilename = `${product.id}.jpg`;
    const destPath = path.join(IMAGES_DIR, imageFilename);

    console.log(`[${i + 1}/${total}] ${product.brand} - ${product.name}`);

    // 1. Check if image already exists
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`   -> Already exists. Skipping.`);
      skipCount++;
      continue;
    }

    // 2. Search for product image
    const searchQuery = `${product.brand} ${product.name}`;
    console.log(`   -> Searching images for: "${searchQuery}"`);
    const results = await searchImages(searchQuery);

    if (results.length === 0) {
      console.log("   -> No image results found.");
      failCount++;
      continue;
    }

    // 3. Try to download image (try top 3 search results first, then try thumbnails)
    let downloaded = false;

    // Try direct image URLs from top 3 results
    const maxRetries = Math.min(results.length, 3);
    for (let r = 0; r < maxRetries; r++) {
      const imgUrl = results[r].image;
      if (!imgUrl) continue;
      console.log(`   -> Trying direct URL [${r + 1}]: ${imgUrl.substring(0, 70)}...`);
      downloaded = await downloadImage(imgUrl, destPath);
      if (downloaded) break;
    }

    // If direct URLs fail, try thumbnail URLs (usually hosted on Bing CDN, very stable)
    if (!downloaded) {
      console.log(`   -> Direct URLs failed. Trying CDN thumbnail fallback...`);
      for (let r = 0; r < maxRetries; r++) {
        const thumbUrl = results[r].thumbnail;
        if (!thumbUrl) continue;
        console.log(`   -> Trying thumbnail [${r + 1}]: ${thumbUrl.substring(0, 70)}...`);
        downloaded = await downloadImage(thumbUrl, destPath);
        if (downloaded) break;
      }
    }

    if (downloaded) {
      console.log(`   ✓ Success! Saved as ${imageFilename}`);
      successCount++;
    } else {
      console.log(`   ✗ Failed to download any image for this product.`);
      failCount++;
    }

    // Delay between products to prevent rate limiting
    if (i < total - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\n=== Download Summary ===");
  console.log(`✓ Successfully downloaded: ${successCount}`);
  console.log(`• Skipped (already exist): ${skipCount}`);
  console.log(`✗ Failed to download:     ${failCount}`);
  console.log("========================");
}

main().catch((err) => {
  console.error("Downloader encountered a fatal error:", err);
});
