import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

// ✅ ทำ __dirname สำหรับ ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function baseDefinition() {
  return {
    openapi: "3.0.0",
    info: {
      title: "Backend API",
      version: "1.0.0",
      description: "API Documentation with Swagger",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local" },
      { url: "https://09-backend.vercel.app", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter: Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            firstname: { type: "string", example: "Seed" },
            fullname: { type: "string", example: "Seed User" },
            lastname: { type: "string", example: "User" },
            username: { type: "string", example: "seed_user" },
            status: { type: "string", example: "active" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        NewUser: {
          type: "object",
          required: [
            "firstname",
            "fullname",
            "lastname",
            "username",
            "password",
            "status",
          ],
          properties: {
            firstname: { type: "string" },
            fullname: { type: "string" },
            lastname: { type: "string" },
            username: { type: "string" },
            password: { type: "string" },
            status: { type: "string", example: "active" },
          },
        },
        Login: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

function generateSpec() {
  const swaggerDefinition = baseDefinition();

  const options = {
    definition: swaggerDefinition,
    apis: [
      path.join(__dirname, "index.js"),
      path.join(__dirname, "routes/*.js"),
    ],
  };

  const fullSpec = swaggerJSDoc(options);

  const allowed = new Set([
    "/",
    "/ping",
    "/login",
    "/logout",
    "/api/users",
    "/api/users/{id}",
    "/users",
    "/users/{id}",
    "/api/data",
  ]);

  const filteredPaths = {};
  for (const p of Object.keys(fullSpec.paths || {})) {
    if (allowed.has(p)) filteredPaths[p] = fullSpec.paths[p];
  }

  return {
    ...fullSpec,
    paths: filteredPaths,
  };
}

const specs = generateSpec();

// ✅ ES Module export
export default specs;
