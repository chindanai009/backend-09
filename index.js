const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

// ต้องเช็คว่าไฟล์ swagger.js และ routes เขียนแบบ module.exports หรือไม่
// ถ้าไฟล์เหล่านั้นใช้ export default ให้เปลี่ยนเป็น module.exports ด้วย
const swaggerSpec = require("./swagger.js"); 
const usersRouter = require("./routes/users.js");
const authRouter = require("./routes/auth.js");

const app = express();

/* ===============================
   ✅ MIDDLEWARE
================================ */
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// บรรทัดนี้สำคัญ: Preflight request
app.options("*", cors());

/* ===============================
   ✅ HEALTH CHECK
================================ */
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

app.get("/ping", (req, res) => {
    res.send("pong");
});

/* ===============================
   ✅ SWAGGER
================================ */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ===============================
   ✅ ROUTES
================================ */
app.use("/users", usersRouter);
app.use("/login", authRouter);

/* ===============================
   ✅ ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
    });
});

/* ===============================
   ✅ EXPORT สำหรับ VERCEL (ใช้ module.exports คู่กับ require)
================================ */
module.exports = app;