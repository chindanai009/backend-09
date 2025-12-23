const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * @swagger
 * /login:
 *   post:
 *     summary: เข้าสู่ระบบ (Login)
 *     description: |
 *       ตรวจสอบข้อมูลประจำตัวและสร้าง JWT Token สำหรับการเข้าถึง protected routes
 *       
 *       **ขั้นตอน:**
 *       1. ตรวจสอบว่า username มีอยู่ในระบบ
 *       2. ตรวจสอบรหัสผ่านว่าตรงกับข้อมูลในฐานข้อมูล
 *       3. สร้าง JWT Token ที่มีอายุ 1 ชั่วโมง
 *       4. ส่งกลับ token สำหรับใช้ในการเข้าถึง API endpoints อื่น ๆ
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: "it68a"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: "JWT Token - ใช้ใน header: Authorization: Bearer <token>"
 *       401:
 *         description: ข้อมูลประจำตัวไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   error: "User not found"
 *               invalidPassword:
 *                 value:
 *                   error: "Invalid password"
 *       500:
 *         description: เซิร์ฟเวอร์เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Login failed"
 */
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM tbl_users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, fullname: user.fullname, lastname: user.lastname }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
