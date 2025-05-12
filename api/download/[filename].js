const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  const { filename } = req.query;
  const filePath = path.join(process.cwd(), filename);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
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
    // Get the user from the cookie
    const userCookie = req.cookies?.user;
    let user = null;

    if (userCookie) {
      try {
        user = JSON.parse(userCookie);
      } catch (e) {
        console.error("Error parsing user cookie:", e);
      }
    }

    // If no user cookie, try to get from Authorization header
    if (!user && req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        try {
          // You can verify the JWT token here if needed
          // const decoded = jwt.verify(token, process.env.JWT_SECRET);
          // user = decoded;
          user = { id: 1, role: "admin" }; // Temporary for testing
        } catch (e) {
          console.error("Error verifying token:", e);
        }
      }
    }

    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      // Set cookie for the response
      res.setHeader("Set-Cookie", [
        `user=${JSON.stringify(user)}; Path=/; HttpOnly; SameSite=None; Secure`,
        `next-auth.csrf-token=${
          req.cookies?.["next-auth.csrf-token"] || ""
        }; Path=/; HttpOnly; SameSite=None; Secure`,
      ]);

      res.send(fileContent);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download the file" });
  }
};
