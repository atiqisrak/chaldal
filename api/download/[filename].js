const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  const { filename } = req.query;
  const filePath = path.join(process.cwd(), filename);

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

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(fileContent);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download the file" });
  }
};
