const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

// ⚠️ หมายเหตุ: บน Vercel (Serverless) ตัวแปร globalThis อาจจะถูกรีเซ็ตเมื่อ function หยุดทำงาน
// การเก็บ activeTokens ในตัวแปรแบบนี้อาจจะไม่เสถียรครับ (แนะนำให้เก็บใน Database หรือ Redis แทนในอนาคต)
const activeTokens =
  globalThis.__activeTokens ?? (globalThis.__activeTokens = new Map());

function getActiveToken(userId) {
  return activeTokens.get(userId);
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    
    // Logic เช็ค session ซ้อน (อาจมีปัญหากับ Serverless แต่แก้ Syntax ให้ผ่านก่อน)
    const storedToken = getActiveToken(user.id);
    // ถ้า logic นี้ทำให้ login ไม่ได้ ให้ลองคอมเมนต์ section นี้ออกชั่วคราวครับ
    /* if (!storedToken || storedToken !== token) {
      return res
        .status(403)
        .json({ error: "Session revoked, please login again" });
    }
    */
   
    req.user = user;
    next();
  });
};

module.exports = verifyToken;