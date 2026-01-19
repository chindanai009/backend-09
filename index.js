// index.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");

// ✅ เรียกใช้ไฟล์ swagger.js (ตอนนี้มันคือ Object config แล้ว)
const swaggerSpec = require("./swagger.js");
const { db } = require("./config/db.js");

const usersRouter = require("./routes/users.js");

const app = express();

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

// เพิ่มหลังจาก app.get("/", ...) 
app.get("/ping", (req, res) => {
    res.json({ status: "pong", message: "Server is alive" });
});

// ✅ SWAGGER Setup - Use CDN for Vercel compatibility
const swaggerOptions = {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js'
    ]
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// ✅ ROUTES
app.use("/api/users", usersRouter);

// ✅ LOGIN Route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                status: "error",
                message: "Username and password are required"
            });
        }

        // Find user by username
        const [rows] = await db.execute(
            "SELECT id, username, password, firstname, lastname, status FROM tbl_users WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid username or password"
            });
        }

        const user = rows[0];

        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({
                status: "error",
                message: "Account is not active"
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "error",
                message: "Invalid username or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            status: "ok",
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});

// ✅ LOGOUT Route (Protected)
const verifyToken = require("./middleware/auth.js");

app.post("/logout", verifyToken, (req, res) => {
    // For JWT-based auth, logout is handled client-side by removing the token
    // This endpoint confirms the token was valid and logs the action
    res.status(200).json({
        status: "ok",
        message: "Logout successful",
        user: req.user
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err);
    res.status(500).json({ error: err.message });
});

// Export for Vercel
module.exports = app;

// Run Local
if (require.main === module) {
    app.listen(3000, () => console.log("Server running on port 3000"));
}