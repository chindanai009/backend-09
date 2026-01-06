const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs/swagger.json", (req, res) => {
    res.json(swaggerSpec);
});

app.use("/login", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));

module.exports = app;