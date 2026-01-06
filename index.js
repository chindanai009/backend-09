const express = require("express");
const cors = require("cors");

// 👇 แก้ไขจุดสำคัญ: ดึง swaggerUi และ specs มาจากไฟล์ swagger.js ที่เราเพิ่งแก้
// (เพราะใน swagger.js เราเขียน module.exports = { swaggerUi, specs }; ไว้)
const { swaggerUi, specs } = require("./swagger.js"); 

const usersRouter = require("./routes/users.js");
// const authRouter = require("./routes/auth.js"); // ⚠️ เปิดบรรทัดนี้เมื่อมีไฟล์ routes/auth.js แล้วเท่านั้น

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

// Preflight request
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
   ✅ SWAGGER SETUP
================================ */
// ใช้ตัวแปร specs ที่ดึงมาจาก swagger.js
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/* ===============================
   ✅ ROUTES
================================ */
app.use("/users", usersRouter);
// app.use("/login", authRouter); // ⚠️ เปิดใช้เมื่อมีไฟล์

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
   ✅ SERVER START
================================ */
// ส่วนนี้ช่วยให้รันในเครื่อง Local ได้ (node index.js)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Docs available at http://localhost:${PORT}/api-docs`);
    });
}

// Export สำหรับ Vercel
module.exports = app;