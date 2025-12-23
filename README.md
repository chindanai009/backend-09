# Backend API Documentation

ระบบจัดการผู้ใช้ (User Management System) — Node.js + Express + MySQL

## 📚 API Documentation

### Swagger UI
เข้าดูเอกสาร API แบบ interactive ได้ที่:
```
http://localhost:3000/api-docs
```

Swagger UI ให้คุณสามารถ:
- ดูรายละเอียด endpoint ทั้งหมด
- ทดสอบ API endpoints โดยตรง
- ดูตัวอย่าง request/response
- ค้นหา endpoint ที่ต้องการ

---

## 🚀 Quick Start

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า environment
ทำสำเนาไฟล์เทมเพลต:
```bash
cp .env.example .env.local
```

แก้ไขค่าตัวแปร `.env.local` เพื่อเชื่อมต่อฐานข้อมูลของคุณ:
```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database
PORT=3000
JWT_SECRET=your_secret_key
```

### 3. รันเซิร์ฟเวอร์
```bash
# Development (ใช้ .env.local)
npm run dev

# Production (ใช้ .env.production)
npm run prod

# หรือรัน default
npm start
```

เซิร์ฟเวอร์จะเริ่มที่ `http://localhost:3000`

---

## 📋 API Endpoints

### Authentication (การเข้าสู่ระบบ)

#### POST /login
เข้าสู่ระบบและรับ JWT Token

**Request:**
```json
{
  "username": "it68a",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Users (การจัดการผู้ใช้)

#### GET /users
ดึงรายการผู้ใช้ทั้งหมด (ต้องมี Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "firstname": "John",
    "fullname": "John Doe",
    "lastname": "Doe"
  }
]
```

---

#### POST /users
สร้างผู้ใช้ใหม่

**Request:**
```json
{
  "firstname": "Jane",
  "fullname": "Jane Doe",
  "lastname": "Doe",
  "username": "janedoe",
  "password": "securepassword123",
  "status": "active"
}
```

**Response (200):**
```json
{
  "id": 5,
  "firstname": "Jane",
  "fullname": "Jane Doe",
  "lastname": "Doe",
  "username": "janedoe",
  "status": "active"
}
```

---

#### GET /users/:id
ดึงข้อมูลผู้ใช้คนหนึ่ง (ต้องมี Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "firstname": "John",
  "fullname": "John Doe",
  "lastname": "Doe",
  "username": "johndoe",
  "password": "$2b$10$...",
  "status": "active"
}
```

---

#### PUT /users/:id
อัพเดตข้อมูลผู้ใช้ (ต้องมี Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstname": "Jane",
  "fullname": "Jane Smith",
  "lastname": "Smith",
  "password": "newpassword456"
}
```

**Response (200):**
```json
{
  "message": "User updated successfully"
}
```

---

#### DELETE /users/:id
ลบผู้ใช้ (ต้องมี Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "User deleted"
}
```

---

## 🔐 Authentication (JWT)

### วิธีใช้ JWT Token

1. **ดึง Token:** เรียก `/login` พร้อม username และ password
2. **เก็บ Token:** บันทึก token ไว้ (เช่นใน localStorage)
3. **ส่ง Token:** ใน header ของ request อื่น ๆ:
   ```
   Authorization: Bearer <token>
   ```

### Token Expiry (อายุของ Token)
- Token หมดอายุใน **1 ชั่วโมง**
- หลังหมดอายุต้องเรียก `/login` ใหม่

---

## 🛠️ Technologies

- **Node.js** — JavaScript runtime
- **Express.js** — Web framework
- **MySQL** — Database
- **JWT** — Authentication
- **bcrypt** — Password hashing
- **Swagger/OpenAPI** — API Documentation

---

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js          # Database connection pool
│   └── swagger.js     # Swagger configuration
├── middleware/
│   └── auth.js        # JWT verification middleware
├── routes/
│   ├── auth.js        # Login endpoint
│   └── users.js       # User CRUD endpoints
├── index.js           # Server entry point
├── .env.local         # Development environment (ignored by git)
├── .env.production    # Production environment
├── .env.example       # Template for environment variables
└── package.json       # Dependencies
```

---

## 🤝 How to Test API

### Using Swagger UI (Recommended)
1. เรียก `npm run dev`
2. เข้า `http://localhost:3000/api-docs`
3. คลิก **Try it out** บน endpoint ที่ต้องการทดสอบ
4. ใส่ข้อมูล แล้วคลิก **Execute**

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"it68a","password":"password123"}'

# Get users (with token)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <token>"
```

### Using Postman
1. Import endpoints จาก Swagger (`/api-docs` JSON)
2. หรือสร้าง requests ด้วยตนเอง
3. ส่ง requests แล้วดู responses

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database username | `root` |
| `DB_PASS` | Database password | `password123` |
| `DB_NAME` | Database name | `db_shop` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key สำหรับ JWT | `METjMXahPtaHtP5J...` |
| `NODE_ENV` | Environment (dev/prod) | `development` |

---

## ✅ Deployment (Vercel)

### การตั้งค่า Vercel
1. Push code ไป GitHub
2. Deploy ใน Vercel:
   - ตั้ง `NODE_ENV=production`
   - ระบบจะใช้ `.env.production` อัตโนมัติ
3. ตั้งค่า Environment Variables ใน Vercel dashboard:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASS`
   - `DB_NAME`
   - `JWT_SECRET`

---

## 🐛 Troubleshooting

### "Token not provided" error
- เช็คว่ามี `Authorization` header
- Format ต้องเป็น `Bearer <token>`

### "Invalid or expired token" error
- Token หมดอายุแล้ว → Login ใหม่
- Token เสียหาย → Login ใหม่

### Database connection error
- เช็คค่า `.env` ว่าถูกต้อง
- เช็คว่า MySQL server กำลังทำงาน

---

## 📞 Support

สำหรับคำถามหรือปัญหา:
1. ดูในไฟล์ README นี้
2. ดูใน Swagger API Docs (`/api-docs`)
3. ติดต่อ IT Support
