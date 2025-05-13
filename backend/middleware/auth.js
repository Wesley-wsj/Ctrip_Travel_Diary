const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Staff = require('../models/staff');
require('dotenv').config();

// 获取服务器基础URL
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

// 基础认证中间件 - 允许所有已登录用户访问
const auth = async function (req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ msg: '无Token' });

  try {
    let decoded;
    let userInfo;
    
    // 先尝试用 JWT_SECRET 验证（管理员）
    try {
      decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      // 从 Staff 表中查找管理员
      userInfo = await Staff.findByPk(decoded.id);
      if (userInfo) {
        req.user = {
          id: userInfo.id,
          username: userInfo.username,
          avatar_url: userInfo.avatar_url,
          role: 'admin'
        };
        return next();
      }
    } catch (err) {
      // 如果失败，尝试用 JWT_REVIEWER_SECRET 验证（审核员）
      try {
        decoded = jwt.verify(token.split(' ')[1], process.env.JWT_REVIEWER_SECRET);
        // 从 Staff 表中查找审核员
        userInfo = await Staff.findByPk(decoded.id);
        if (userInfo) {
          req.user = {
            id: userInfo.id,
            username: userInfo.username,
            avatar_url: userInfo.avatar_url,
            role: 'reviewer'
          };
          return next();
        }
      } catch (err) {
        // 最后尝试用 JWT_USER_SECRET 验证（普通用户）
        try {
          decoded = jwt.verify(token.split(' ')[1], process.env.JWT_USER_SECRET);
          // 从 User 表中查找普通用户
          userInfo = await User.findByPk(decoded.id);
          if (userInfo) {
            req.user = {
              id: userInfo.id,
              username: userInfo.username,
              avatar_url: `${getBaseUrl(req)}${userInfo.avatar_url.substring(2)}`,
              role: 'user'
            };
            return next();
          }
        } catch (err) {
          throw new Error('Token验证失败');
        }
      }
    }

    // 如果所有验证都失败
    return res.status(403).json({ msg: '用户不存在或Token无效' });
  } catch (err) {
    res.status(403).json({ msg: 'Token无效' });
  }
};

// 用户认证中间件 - 只允许普通用户访问
const userAuth = function (req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({ msg: '需要用户权限' });
    }
    next();
  });
};

// 工作人员认证中间件 - 只允许工作人员访问
const staffAuth = function (req, res, next) {
  auth(req, res, () => {
    if (!['admin', 'reviewer'].includes(req.user.role)) {
      return res.status(403).json({ msg: '需要工作人员权限' });
    }
    next();
  });
};

// 管理员认证中间件 - 只允许管理员访问
const adminAuth = function (req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: '需要管理员权限' });
    }
    next();
  });
};

module.exports = {
  auth,
  userAuth,
  staffAuth,
  adminAuth
};

