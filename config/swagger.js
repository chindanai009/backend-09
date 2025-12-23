const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend API Documentation",
      version: "1.0.0",
      description:
        "ระบบจัดการผู้ใช้ (User Management System) - API Documentation\n\n**หมายเหตุ:**\n- Authentication: ใช้ JWT Token ในส่วน header `Authorization: Bearer <token>`\n- Response format: JSON\n- Database: MySQL 3.15.2",
      contact: {
        name: "IT Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.example.com"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Token สำหรับ Authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", description: "User ID" },
            firstname: { type: "string", description: "ชื่อจริง" },
            fullname: { type: "string", description: "ชื่อเต็ม" },
            lastname: { type: "string", description: "นามสกุล" },
            username: { type: "string", description: "ชื่อผู้ใช้" },
            password: {
              type: "string",
              description: "รหัสผ่าน (hashed)",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              description: "สถานะผู้ใช้",
            },
          },
          required: [
            "firstname",
            "fullname",
            "lastname",
            "username",
            "password",
            "status",
          ],
        },
        LoginRequest: {
          type: "object",
          properties: {
            username: { type: "string", description: "ชื่อผู้ใช้" },
            password: { type: "string", description: "รหัสผ่าน" },
          },
          required: ["username", "password"],
        },
        CreateUserRequest: {
          type: "object",
          properties: {
            firstname: { type: "string", description: "ชื่อจริง" },
            fullname: { type: "string", description: "ชื่อเต็ม" },
            lastname: { type: "string", description: "นามสกุล" },
            username: { type: "string", description: "ชื่อผู้ใช้" },
            password: { type: "string", description: "รหัสผ่าน" },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              description: "สถานะผู้ใช้",
            },
          },
          required: [
            "firstname",
            "fullname",
            "lastname",
            "username",
            "password",
            "status",
          ],
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            firstname: { type: "string", description: "ชื่อจริง" },
            fullname: { type: "string", description: "ชื่อเต็ม" },
            lastname: { type: "string", description: "นามสกุล" },
            password: {
              type: "string",
              description:
                "รหัสผ่านใหม่ (optional - ถ้าไม่ส่งจะไม่อัพเดต)",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", description: "ข้อความข้อผิดพลาด" },
            message: { type: "string", description: "รายละเอียดเพิ่มเติม" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
