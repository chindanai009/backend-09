import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verifyToken, { activeTokens } from "../middleware/auth.js";
import { db } from "../config/db.js";

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and receive a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  const missing = ["username", "password"].find(
    (field) => !req.body[field] || req.body[field] === ""
  );
  if (missing) {
    return res.status(400).json({
      error: `Missing required field: ${missing}`,
    });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, fullname, lastname, password FROM tbl_users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, fullname: user.fullname, lastname: user.lastname },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    activeTokens.set(user.id, token);

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @openapi
 * /logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Invalidate the current user's session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", verifyToken, (req, res) => {
  activeTokens.delete(req.user.id);
  res.json({ status: "ok", message: "Logged out" });
});

export default router;
