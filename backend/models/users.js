// models/users.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'users'
});

// 自动加密密码
User.beforeCreate(async (user, options) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
});

module.exports = User;
