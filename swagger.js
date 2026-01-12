// swagger.js
// รวม Config และ Spec ไว้ในตัวแปรเดียว (ไม่ต้องใช้ swagger-jsdoc อ่านไฟล์)
const specs = {
  openapi: "3.0.0",
  info: {
    title: "Backend API",
    version: "1.0.0",
    description: "API Documentation",
  },
  servers: [
    { url: "https://09-backend.vercel.app", description: "Production" },
  ],
  tags: [
    { name: "Users", description: "User management" },
    { name: "Auth", description: "Authentication" },
    { name: "Health", description: "Server health check" }
  ],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Check server status",
        responses: { 200: { description: "Server is running" } }
      }
    },

    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" }
            }
          }
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logout successful" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create User",
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/NewUser" } } }
        },
        responses: { 201: { description: "Created" } }
      }
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User details", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Not found" }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstname: { type: "string" },
                  fullname: { type: "string" },
                  lastname: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                  status: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "User updated" },
          404: { description: "Not found" }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User deleted" },
          404: { description: "Not found" }
        }
      }
    }
  },
  // 👇 ส่วนประกอบ (Schemas) ที่คุณเขียนไว้ ผมย้ายมาใส่ตรงนี้
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
        required: ["firstname", "fullname", "lastname", "username", "password", "status"],
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
};

// ✅ Export แบบ CommonJS เพื่อให้ index.js เรียกใช้ได้โดยไม่พัง
module.exports = specs;