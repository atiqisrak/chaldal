const puppeteer = require("puppeteer");
const fs = require("fs");

/**
 * Scrape a single Chaldal category page and save products to a JSON file.
 * @param {string} url - The Chaldal category URL.
 * @param {string} filename - The filename to save the JSON data.
 * @returns {Promise<Array>} - The scraped products array.
 */
const scrapeCategory = async (url, filename = "chaldal_products.json") => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`🔍 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scroll to bottom to load more products
    await autoScroll(page);

    const products = await page.evaluate(() => {
      const items = [];
      const productElements = document.querySelectorAll(".product");

      productElements.forEach((el) => {
        const name = el.querySelector(".name")?.innerText || "";
        const unit = el.querySelector(".subText")?.innerText || "";
        const price =
          el.querySelector(".price span:last-child")?.innerText || "";
        const image = el.querySelector("img")?.src || "";

        items.push({ name, unit, price: `৳${price}`, image });
      });

      return items;
    });

    // Save to file
    fs.writeFileSync(filename, JSON.stringify(products, null, 2));
    console.log(`✅ Scraped ${products.length} products. Saved to ${filename}`);
    return products;
  } catch (err) {
    console.error(`❌ Error scraping ${url}:`, err.message);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Helper to scrape multiple categories in sequence.
 * @param {Array<string>} urls - Array of Chaldal category URLs.
 * @returns {Promise<Array<{url: string, filename: string, products: Array}>>}
 */
const scrapeMultipleCategories = async (urls) => {
  const results = [];
  for (const url of urls) {
    // Use the last part of the URL as the filename, fallback to timestamp
    let slug = url.split("/").filter(Boolean).pop() || `cat_${Date.now()}`;
    slug = slug.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `chaldal_${slug}.json`;
    try {
      const products = await scrapeCategory(url, filename);
      results.push({ url, filename, products });
    } catch (err) {
      results.push({ url, filename, error: err.message });
    }
  }
  return results;
};

// Scroll function for lazy loading
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

module.exports = { scrapeCategory, scrapeMultipleCategories };
