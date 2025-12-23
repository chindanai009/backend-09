// server entrypoint — minimal: middleware + route mounting
// Load environment based on NODE_ENV: .env.production (default) or .env.local
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
require("dotenv").config({ path: envFile });

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

app.use(express.json());
app.use(cors());

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");

// simple health check
app.get("/ping", (req, res) => res.json({ status: "ok" }));

app.use("/users", usersRouter);
app.use("/login", authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
