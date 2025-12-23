const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');

// GET /users - list users (protected)
router.get('/', verifyToken, async (req, res) => {
	try {
		const [rows] = await db.query('SELECT id, firstname, fullname, lastname FROM tbl_users');
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: 'Query failed' });
	}
});

// GET /users/:id
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

// POST /users - create user
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

// PUT /users/:id - update user
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

// DELETE /users/:id
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
