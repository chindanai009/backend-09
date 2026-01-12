// swagger.js
// รวม Config และ Spec ไว้ในตัวแปรเดียว (ไม่ต้องใช้ swagger-jsdoc อ่านไฟล์)
const specs = {
  openapi: "3.0.0",
  info: {
    title: "Backend API",
    version: "1.0.0",
    description: "API Documentation with RESTful HTTP Status Codes",
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
        responses: {
          200: { description: "OK - Server is running" },
          500: { description: "Internal Server Error" }
        }
      }
    },
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" }
            }
          }
        },
        responses: {
          200: { description: "OK - Login successful" },
          400: { description: "Bad Request - Missing username or password" },
          401: { description: "Unauthorized - Invalid credentials or inactive account" },
          500: { description: "Internal Server Error" }
        }
      }
    },
    "/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK - Logout successful" },
          401: { description: "Unauthorized - No token provided" },
          403: { description: "Forbidden - Invalid or expired token" }
        }
      }
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100 }, description: "Number of users per page" },
          { in: "query", name: "page", schema: { type: "integer", minimum: 1 }, description: "Page number" }
        ],
        responses: {
          200: {
            description: "OK - List of users",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } }
              }
            }
          },
          401: { description: "Unauthorized - No token provided" },
          403: { description: "Forbidden - Invalid or expired token" },
          500: { description: "Internal Server Error - Database error" }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create User (No Auth Required)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/NewUser" } } }
        },
        responses: {
          201: { description: "Created - User created successfully" },
          400: { description: "Bad Request - Missing required fields" },
          409: { description: "Conflict - Username already exists" },
          500: { description: "Internal Server Error - Database error" }
        }
      }
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK - User details", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Unauthorized - No token provided" },
          403: { description: "Forbidden - Invalid or expired token" },
          404: { description: "Not Found - User not found" },
          500: { description: "Internal Server Error - Database error" }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUser" }
            }
          }
        },
        responses: {
          200: { description: "OK - User updated successfully" },
          400: { description: "Bad Request - No fields to update" },
          401: { description: "Unauthorized - No token provided" },
          403: { description: "Forbidden - Invalid or expired token" },
          404: { description: "Not Found - User not found" },
          500: { description: "Internal Server Error - Database error" }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "OK - User deleted successfully" },
          401: { description: "Unauthorized - No token provided" },
          403: { description: "Forbidden - Invalid or expired token" },
          404: { description: "Not Found - User not found" },
          500: { description: "Internal Server Error - Database error" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstname: { type: "string", example: "John" },
          fullname: { type: "string", example: "John Doe" },
          lastname: { type: "string", example: "Doe" },
          username: { type: "string", example: "johndoe" },
          status: { type: "string", example: "active" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      NewUser: {
        type: "object",
        required: ["firstname", "fullname", "lastname", "username", "password"],
        properties: {
          firstname: { type: "string", example: "John" },
          fullname: { type: "string", example: "John Doe" },
          lastname: { type: "string", example: "Doe" },
          username: { type: "string", example: "johndoe" },
          password: { type: "string", example: "securepassword123" },
          status: { type: "string", example: "active", default: "active" },
        },
      },
      UpdateUser: {
        type: "object",
        properties: {
          firstname: { type: "string" },
          fullname: { type: "string" },
          lastname: { type: "string" },
          username: { type: "string" },
          password: { type: "string" },
          status: { type: "string" }
        },
      },
      Login: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "johndoe" },
          password: { type: "string", example: "securepassword123" },
        },
      },
      Error: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Error description" },
          code: { type: "string", example: "ERROR_CODE" }
        }
      }
    },
  },
};

// ✅ Export แบบ CommonJS เพื่อให้ index.js เรียกใช้ได้โดยไม่พัง
module.exports = specs;