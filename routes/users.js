const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: ดึงรายการผู้ใช้ทั้งหมด
 *     description: |
 *       ดึงข้อมูลผู้ใช้ทั้งหมดจากระบบ (ชื่อจริง, ชื่อเต็ม, นามสกุล)
 *       
 *       **หมายเหตุ:** 
 *       - ต้องมี JWT Token ที่ถูกต้อง ใน header `Authorization: Bearer <token>`
 *       - Token ได้จากการ Login (/login)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: "John"
 *                   fullname:
 *                     type: string
 *                     example: "John Doe"
 *                   lastname:
 *                     type: string
 *                     example: "Doe"
 *       401:
 *         description: ไม่ได้รับการยืนยันตัวตน (Missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เซิร์ฟเวอร์เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: สร้างผู้ใช้ใหม่ (สมัครสมาชิก)
 *     description: |
 *       เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ พร้อมการ hash รหัสผ่าน
 *       
 *       **ขั้นตอน:**
 *       1. ตรวจสอบว่า password ไม่ว่าง
 *       2. Hash รหัสผ่านด้วย bcrypt (10 rounds)
 *       3. บันทึกข้อมูลลงในฐานข้อมูล
 *       4. ส่งกลับ ID และข้อมูลผู้ใช้ (ไม่รวม password)
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             firstname: "John"
 *             fullname: "John Doe"
 *             lastname: "Doe"
 *             username: "johndoe"
 *             password: "securepassword123"
 *             status: "active"
 *     responses:
 *       200:
 *         description: สร้างผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 5
 *                 firstname:
 *                   type: string
 *                   example: "John"
 *                 fullname:
 *                   type: string
 *                   example: "John Doe"
 *                 lastname:
 *                   type: string
 *                   example: "Doe"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 status:
 *                   type: string
 *                   example: "active"
 *       400:
 *         description: ข้อมูลที่ส่งมาไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Password is required"
 *       500:
 *         description: เซิร์ฟเวอร์เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Insert failed"
 */
router.get('/', verifyToken, async (req, res) => {
	try {
		const [rows] = await db.query('SELECT id, firstname, fullname, lastname FROM tbl_users');
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: 'Query failed' });
	}
});

router.post('/', async (req, res) => {
	const { firstname, fullname, lastname, username, password, status } = req.body;
	try {
		if (!password) return res.status(400).json({ error: 'Password is required' });
		const hashedPassword = await bcrypt.hash(password, 10);

		const [result] = await db.query(
			'INSERT INTO tbl_users (firstname, fullname, lastname, username, password, status) VALUES (?, ?, ?, ?, ?, ?)',
			[firstname, fullname, lastname, username, hashedPassword, status]
		);

		res.json({ id: result.insertId, firstname, fullname, lastname, username, status });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Insert failed' });
	}
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ตาม ID
 *     description: |
 *       ดึงรายละเอียดทั้งหมดของผู้ใช้คนหนึ่ง (รวม username และข้อมูลอื่น ๆ)
 *       
 *       **หมายเหตุ:** 
 *       - ต้องมี JWT Token ที่ถูกต้อง
 *       - ID ต้องมีอยู่ในระบบ ถ้าไม่พบจะ return 404
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID (ตัวเลข)
 *         example: 1
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: ไม่ได้รับการยืนยันตัวตน
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ไม่พบผู้ใช้ที่มี ID นี้
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User not found"
 *   put:
 *     summary: อัพเดตข้อมูลผู้ใช้
 *     description: |
 *       แก้ไขข้อมูลผู้ใช้ (ชื่อ นามสกุล) และ/หรือ รหัสผ่าน
 *       
 *       **ขั้นตอน:**
 *       1. ค้นหาผู้ใช้ตาม ID
 *       2. อัพเดตชื่อ นามสกุล
 *       3. ถ้ามี password ใหม่ จะ hash และอัพเดตด้วย
 *       4. ส่งกลับข้อความสำเร็จ
 *       
 *       **หมายเหตุ:** 
 *       - password เป็น optional - ถ้าไม่ส่งจะไม่อัพเดต
 *       - ต้องมี JWT Token ที่ถูกต้อง
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             firstname: "Jane"
 *             fullname: "Jane Doe"
 *             lastname: "Doe"
 *             password: "newpassword456"
 *     responses:
 *       200:
 *         description: อัพเดตสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *       401:
 *         description: ไม่ได้รับการยืนยันตัวตน
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ไม่พบผู้ใช้ที่มี ID นี้
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เซิร์ฟเวอร์เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: ลบผู้ใช้
 *     description: |
 *       ลบข้อมูลผู้ใช้จากระบบ (permanent delete)
 *       
 *       **หมายเหตุ:** 
 *       - ต้องมี JWT Token ที่ถูกต้อง
 *       - การลบจะเป็นการลบถาวร ไม่สามารถกู้คืนได้
 *       - ID ต้องมีอยู่ในระบบ ถ้าไม่พบจะ return 404
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted"
 *       401:
 *         description: ไม่ได้รับการยืนยันตัวตน
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ไม่พบผู้ใช้ที่มี ID นี้
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เซิร์ฟเวอร์เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', verifyToken, async (req, res, next) => {
	const { id } = req.params;
	try {
		const [rows] = await db.query('SELECT * FROM tbl_users WHERE id = ?', [id]);
		if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
		res.json(rows[0]);
	} catch (err) {
		next(err);
	}
});

router.put('/:id', verifyToken, async (req, res) => {
	const { id } = req.params;
	const { firstname, fullname, lastname, password } = req.body;

	try {
		let query = 'UPDATE tbl_users SET firstname = ?, fullname = ?, lastname = ?';
		const params = [firstname, fullname, lastname];

		if (password) {
			const hashedPassword = await bcrypt.hash(password, 10);
			query += ', password = ?';
			params.push(hashedPassword);
		}

		query += ' WHERE id = ?';
		params.push(id);

		const [result] = await db.query(query, params);
		if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

		res.json({ message: 'User updated successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Update failed' });
	}
});

router.delete('/:id', verifyToken, async (req, res, next) => {
	const { id } = req.params;
	try {
		const [result] = await db.query('DELETE FROM tbl_users WHERE id = ?', [id]);
		if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
		res.json({ message: 'User deleted' });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
