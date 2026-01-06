// index.js
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

// ✅ เรียกใช้ไฟล์ swagger.js (ตอนนี้มันคือ Object config แล้ว)
const swaggerSpec = require("./swagger.js"); 

const usersRouter = require("./routes/users.js");
// ⚠️ คอมเมนต์บรรทัดนี้ไว้ก่อน จนกว่าคุณจะสร้างไฟล์ routes/auth.js และแน่ใจว่ามันเขียนถูก
// const authRouter = require("./routes/auth.js"); 

const app = express();

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

// ✅ SWAGGER Setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ ROUTES
app.use("/users", usersRouter);
// app.use("/login", authRouter); // เปิดเมื่อพร้อม

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