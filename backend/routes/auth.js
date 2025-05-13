// routes/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Staff = require('../models/staff');
require('dotenv').config();

/**
 * POST /api/staff/login
 * 登录接口：校验用户名密码 → 返回 JWT token + 角色
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查找用户
    const user = await Staff.findOne({ where: { username } });
    if (!user) return res.status(401).json({ msg: '用户不存在' });

    // 校验密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: '密码错误' });

    // 根据角色选择不同的密钥签发 token
    const secret = user.role === 'admin' 
      ? process.env.JWT_SECRET 
      : process.env.JWT_REVIEWER_SECRET;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;
