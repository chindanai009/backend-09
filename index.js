import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verifyToken from "./middleware/auth.js";
import { specs } from "./config/swagger.js";
import { db, POOL_SIZE, DB_NAME } from "./config/db.js";
import usersRouter from "./routes/users.js";

const SECRET_KEY = process.env.JWT_SECRET;
const activeTokens =
  globalThis.__activeTokens ?? (globalThis.__activeTokens = new Map());

function setActiveToken(userId, token) {
  activeTokens.set(userId, token);
}

function clearActiveToken(userId) {
  activeTokens.delete(userId);
}

// --------------------------------------------------
// 1) CONFIG / SERVER TUNING
// --------------------------------------------------

const app = express();

// log env summary (no secrets)
console.log("[DB CONFIG]", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  db: DB_NAME,
  port: process.env.DB_PORT ?? 3306,
  poolSize: POOL_SIZE,
});

// --------------------------------------------------
// 2) SMALL UTILS
// --------------------------------------------------

async function runQuery(sql, params = []) {
  if (params.length === 0) {
    const [rows] = await db.query(sql);
    return rows;
  } else {
    const [rows] = await db.execute(sql, params);
    return rows;
  }
}

function sendDbError(res, err, httpCode = 500) {
  console.error("[DB ERROR]", err);
  return res.status(httpCode).json({
    status: "error",
    message: err?.message ?? "Database error",
    code: err?.code ?? null,
  });
}

function requireFields(obj, keys) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === "") {
      return k;
    }
  }
  return null;
}

// --------------------------------------------------
// 3) API DOCUMENTATION - Default Swagger UI
// --------------------------------------------------

// Serve API documentation with default Swagger UI
app.get("/api-docs", (req, res) => {
  const docHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html {
      box-sizing: border-box;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(specs)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(docHtml);
});

app.disable("x-powered-by");
app.set("etag", "strong");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "64kb" }));

// --------------------------------------------------
// 4) HOME ROUTE - Service Landing Page
// --------------------------------------------------

app.get("/", (req, res) => {
  const homePage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Service</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #222;
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 60px 20px;
      text-align: center;
    }
    
    h1 {
      font-size: 2.5em;
      font-weight: 300;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      font-size: 1em;
      color: #666;
      margin-bottom: 40px;
      font-weight: 400;
    }
    
    .links {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 50px;
    }
    
    a {
      padding: 12px 24px;
      text-decoration: none;
      border: 1px solid #222;
      color: #222;
      background: #fff;
      transition: all 0.2s ease;
      font-size: 0.9em;
      letter-spacing: 0.5px;
    }
    
    a:hover {
      background: #222;
      color: #fff;
    }
    
    .divider {
      width: 50px;
      height: 1px;
      background: #ddd;
      margin: 50px auto;
    }
    
    .info {
      text-align: left;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
    }
    
    .info-item h3 {
      font-size: 0.75em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    .info-item p {
      font-size: 0.95em;
      color: #555;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>API Service</h1>
    <p class="subtitle">User management & authentication</p>
    
    <div class="links">
      <a href="/api-docs">Documentation</a>
      <a href="/health">Status</a>
    </div>
    
    <div class="divider"></div>
    
    <div class="info">
      <div class="info-item">
        <h3>Auth</h3>
        <p>JWT-based authentication with secure token management</p>
      </div>
      <div class="info-item">
        <h3>Users</h3>
        <p>Complete CRUD operations for user accounts</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(homePage);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "operational",
    service: "User Management API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

// --------------------------------------------------
// 5) ROUTES
// --------------------------------------------------

/**
 * @openapi
 * /ping:
 *   get:
 *     tags:
 *       - Health
 *     summary: Test DB connection
 *     description: Returns the current database server time to verify connectivity
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 time:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Database error
 */
app.get("/ping", async (req, res) => {
  try {
    const rows = await runQuery("SELECT NOW() AS now");
    res.json({
      status: "ok",
      time: rows[0].now,
    });
  } catch (err) {
    return sendDbError(res, err);
  }
});

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Root endpoint
 *     description: Returns a simple message to confirm server is running
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "✅ Server is running on cloud. Go to /ping to check its status."
 */
app.get("/", (req, res) => {
  res.send("✅ Server is running on cloud. Go to /ping to check its status.");
});

// Users routes
app.use("/users", usersRouter);

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and receive a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const missing = requireFields({ username, password }, [
    "username",
    "password",
  ]);
  if (missing) {
    return res.status(400).json({
      error: `Missing required field: ${missing}`,
    });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, fullname, lastname, password FROM tbl_users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, fullname: user.fullname, lastname: user.lastname },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    setActiveToken(user.id, token);

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @openapi
 * /logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Invalidate the current user's session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       401:
 *         description: Unauthorized
 */
app.post("/logout", verifyToken, (req, res) => {
  clearActiveToken(req.user.id);
  res.json({ status: "ok", message: "Logged out" });
});

/**
 * @openapi
 * /api/data:
 *   get:
 *     tags:
 *       - Misc
 *     summary: Test CORS endpoint
 *     description: Simple endpoint to test CORS configuration
 *     responses:
 *       200:
 *         description: CORS test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, CORS!
 */
app.get("/api/data", (req, res) => {
  res.json({ message: "Hello, CORS!" });
});

// --------------------------------------------------
// 7) GLOBAL FALLBACK ERROR HANDLER
// --------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[UNCAUGHT ERROR]", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

// --------------------------------------------------
// 8) START SERVER
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}

export default app;
