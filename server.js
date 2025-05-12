const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { scrapeMultipleCategories } = require("./scraper");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint to start scraping
app.post("/api/scrape", async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "Please provide an array of URLs" });
    }

    // Use the new helper for batch scraping
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
});

// API endpoint to download JSON files
app.get("/api/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
