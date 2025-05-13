const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Staff = sequelize.define('staff', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  role: DataTypes.ENUM('admin', 'reviewer'),
}, {
  tableName: 'staff', 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Staff;