import express  from "express";
import cors  from "cors";
import swaggerUi  from "swagger-ui-express";
import swaggerSpec  from "./swagger.js";
import usersRouter from "./routes/users.js"; // ของเดิมคุณ
import authRouter from "./routes/auth.js";   // ถ้ามี

const app = express();

/* ===============================
   ✅ MIDDLEWARE (จุดสำคัญ)
================================ */
app.use(cors({
    origin: "*", // สำหรับ Swagger + Vercel
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// รองรับ preflight
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
   ✅ ROUTES (ของเดิม)
================================ */
app.use("/users", usersRouter);
app.use("/login", authRouter);

/* ===============================
   ✅ ERROR HANDLER (กัน 500 crash)
================================ */
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
    });
});

/* ===============================
   ✅ EXPORT สำหรับ VERCEL
================================ */
module.exports = app;
