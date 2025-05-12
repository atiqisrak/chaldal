const { scrapeMultipleCategories } = require("../scraper");

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "Please provide an array of URLs" });
    }

    // Use the helper for batch scraping
    const results = await scrapeMultipleCategories(urls);

    // Add downloadUrl for each result
    const responseResults = results.map((result) => ({
      url: result.url,
      filename: result.filename,
      downloadUrl: `/api/download/${result.filename}`,
      error: result.error || null,
      count: result.products ? result.products.length : 0,
    }));

    res.json({ success: true, results: responseResults });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Failed to scrape the provided URLs" });
  }
};
