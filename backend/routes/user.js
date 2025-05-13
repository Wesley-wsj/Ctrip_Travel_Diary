const express = require('express');
const router = express.Router();
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
require('dotenv').config();

// 获取服务器基础URL
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 使用绝对路径
    const uploadDir = path.join(__dirname, '../uploads/avatar');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

/**
 * POST /api/users/register
 POST http://localhost:5000/api/users/register
  Headers:
    Content-Type: application/json
  Body (raw JSON):
  {
    "username": "testuser",
    "password": "123456",
    "avatar_url": "https://example.com/avatar.jpg"
  }
 */
router.post('/register', upload.single('avatar'), async (req, res) => {
  const { username, password } = req.body;
  let avatar_url = '../uploads/avatar/moren.jpg'; // 默认头像

  if (!username || !password) {
    return res.status(400).json({ msg: '用户名和密码不能为空' });
  }

  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ msg: '用户名已存在' });
    }

    // 如果上传了头像，使用上传的头像
    if (req.file) {
      avatar_url = `../uploads/avatar/${req.file.filename}`;
    }

    const newUser = await User.create({
      username,
      password, // 会自动触发 User.beforeCreate() 加密密码
      avatar_url
    });

    // 注册成功后签发 token
    const token = jwt.sign(
      { id: newUser.id, role: 'user' },
      process.env.JWT_USER_SECRET,
      { expiresIn: '7d' }
    );    // 返回完整的头像URL
    const fullAvatarUrl = `${getBaseUrl(req)}${avatar_url.substring(2)}`;

    res.status(201).json({ 
      msg: '注册成功', 
      token, 
      username: newUser.username,
      avatar_url: fullAvatarUrl 
    });
  } catch (err) {
    console.error(err);
    // 如果上传了文件但注册失败，删除已上传的文件
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('删除上传文件失败:', unlinkErr);
      });
    }
    res.status(500).json({ msg: '服务器错误' });
  }
});

/**
 * POST /api/users/login
 * 用户登录接口
 * POST http://localhost:5000/api/users/login
 * Headers:
 *   Content-Type: application/json
 * Body (raw JSON):
 * {
 *   "username": "testuser",
 *   "password": "123456"
 * }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: '用户名和密码不能为空' });
  }

  try {
    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ msg: '用户名不存在' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: '密码错误' });
    }

    // 生成 token
    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_USER_SECRET,
      { expiresIn: '7d' }
    );

    // 返回完整的头像URL
    const fullAvatarUrl = `${getBaseUrl(req)}${user.avatar_url}`;

    // 返回用户信息和 token
    res.json({
      msg: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar_url: fullAvatarUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 上传头像接口
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ msg: '需要用户权限' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: '请选择要上传的头像' });
    }

    const avatarUrl = `/uploads/avatar/${req.file.filename}`;
    
    await User.update(
      { avatar_url: avatarUrl },
      { where: { id: req.user.id } }
    );

    // 返回完整的头像URL
    const fullAvatarUrl = `${getBaseUrl(req)}${avatarUrl}`;

    res.json({ 
      msg: '头像上传成功',
      avatar_url: fullAvatarUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;
