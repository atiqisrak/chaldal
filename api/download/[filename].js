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
      const csrfToken =
        "e16d4300026d81c71cb06aed5bdb091da176d1b719439dbb71e1bb6bf4f67147|75485f6ed52b4abef44007c0aebf3e7f972cbb0fb04efa298db3ba91c105cc1c";
      const callbackUrl = "https://chaldal-scraper.vercel.app/";
      const userData = {
        id: 2,
        username: "chaldal",
        email: "chaldal@gmail.com",
        name: "Chaldal",
        role: "admin",
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzQyODg0ODQ1LCJleHAiOjE3NDI5NzEyNDV9.VTHZWmndDTJf4HJPyTAqV5lFX2_fXzhLU0iW7mL2tbw",
        has_active_license: true,
      };

      res.setHeader("Set-Cookie", [
        `next-auth.callback-url=${encodeURIComponent(
          callbackUrl
        )}; Path=/; HttpOnly; SameSite=None; Secure`,
        `next-auth.csrf-token=${csrfToken}; Path=/; HttpOnly; SameSite=None; Secure`,
        `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; Path=/; HttpOnly; SameSite=None; Secure`,
        `_ga=GA1.1.2007506391.1746616023; Path=/; SameSite=None; Secure`,
        `_ga_59SFLK756L=GS2.1.s1746618578$o2$g0$t1746618578$j0$l0$h0; Path=/; SameSite=None; Secure`,
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
