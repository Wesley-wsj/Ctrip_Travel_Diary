const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./users');

const TravelDiary = sequelize.define('travel_diaries', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false
  },
  video_url: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reject_reason: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  first_image_ratio: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    comment: '第一张图片的宽高比（宽 / 高）'
  },
  cover: {
    type: DataTypes.STRING(255),
    defaultValue: null,
    comment: '视频第一帧图片相对路径'
  },
  location: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: '地点列表'
  },
  departure_time: {
    type: DataTypes.STRING(50),
    defaultValue: null,
    comment: '出发时间'
  },
  avg_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    comment: '人均花费'
  },
  companions: {
    type: DataTypes.STRING(50),
    defaultValue: null,
    comment: '与谁出行'
  },
  days: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: null,
    comment: '行程天数，支持小数'
  }
}, {
  timestamps: false,
  tableName: 'travel_diaries'
});

// 建立用户与游记的关联
TravelDiary.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

module.exports = TravelDiary;
