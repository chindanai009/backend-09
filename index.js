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
// 3) API DOCUMENTATION - Custom Interactive UI
// --------------------------------------------------

// Serve custom API documentation portal (no static file serving needed)
app.get("/api-docs", (req, res) => {
  const docHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Portal</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 1.1em;
      color: #666;
    }
    
    .swagger-wrapper {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .swagger-wrapper h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.5em;
    }
    
    #swagger-ui {
      padding: 0;
    }
    
    /* Custom Swagger UI styling */
    .swagger-ui .topbar {
      display: none;
    }
    
    .swagger-ui .info {
      margin: 20px 0;
    }
    
    .swagger-ui .info .title {
      color: #667eea;
      font-size: 1.8em;
    }
    
    .swagger-ui .scheme-container {
      background: #f5f5f5;
      border-radius: 6px;
    }
    
    .swagger-ui .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: 600;
    }
    
    .swagger-ui .btn:hover {
      opacity: 0.9;
    }
    
    .swagger-ui .opblock {
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    
    .swagger-ui .opblock.opblock-get {
      border-left-color: #61affe;
    }
    
    .swagger-ui .opblock.opblock-post {
      border-left-color: #49cc90;
    }
    
    .swagger-ui .opblock.opblock-put {
      border-left-color: #fca130;
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-left-color: #f93e3e;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      color: white;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><i class="fas fa-plug"></i> API Portal</h1>
      <p>Interactive REST API Documentation & Testing Platform</p>
    </div>
    
    <div class="swagger-wrapper">
      <h2><i class="fas fa-book"></i> API Endpoints</h2>
      <div id="swagger-ui"></div>
    </div>
    
    <div class="footer">
      <p><i class="fas fa-shield-alt"></i> Secure API Integration | Built for Modern Applications</p>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(specs)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1
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
  <title>User Management Service</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }
    
    .card {
      background: white;
      border-radius: 16px;
      padding: 50px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      margin: 20px;
    }
    
    .icon {
      font-size: 4em;
      color: #667eea;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 2.5em;
      color: #333;
      margin-bottom: 15px;
    }
    
    p {
      font-size: 1.1em;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .button-group {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    a {
      display: inline-block;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1em;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
      border: 2px solid #667eea;
    }
    
    .btn-secondary:hover {
      background: #667eea;
      color: white;
    }
    
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 30px;
      text-align: left;
    }
    
    .feature {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .feature-icon {
      color: #667eea;
      margin-right: 10px;
    }
    
    .feature h3 {
      font-size: 0.95em;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <i class="fas fa-cube"></i>
    </div>
    
    <h1>Service API</h1>
    <p>Enterprise-grade user management and authentication platform</p>
    
    <div class="button-group">
      <a href="/api-docs" class="btn-primary">
        <i class="fas fa-book"></i> View API Docs
      </a>
      <a href="/health" class="btn-secondary">
        <i class="fas fa-heartbeat"></i> Health Check
      </a>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3><i class="fas fa-lock feature-icon"></i> Secure Auth</h3>
      </div>
      <div class="feature">
        <h3><i class="fas fa-users feature-icon"></i> User Mgmt</h3>
      </div>
      <div class="feature">
        <h3><i class="fas fa-chart-line feature-icon"></i> Analytics</h3>
      </div>
      <div class="feature">
        <h3><i class="fas fa-cloud feature-icon"></i> REST API</h3>
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
