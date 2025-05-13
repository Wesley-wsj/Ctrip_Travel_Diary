// scripts/initStaffAndUsers.js
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const Staff = require('../models/staff');
const User = require('../models/users');

async function insertAccounts() {
  await sequelize.sync(); // 同步表结构

  // 初始化工作人员账号
  const staffList = [
    { username: 'admin', password: 'admin', role: 'admin' },
    { username: 'reviewer', password: 'reviewer', role: 'reviewer' }
  ];

  for (const staff of staffList) {
    const existing = await Staff.findOne({ where: { username: staff.username } });
    if (!existing) {
      const hashed = await bcrypt.hash(staff.password, 10);
      await Staff.create({
        username: staff.username,
        password: hashed,
        role: staff.role
      });
      console.log(`插入工作人员：${staff.username}`);
    } else {
      console.log(`已存在，跳过：${staff.username}`);
    }
  }

  // 初始化普通用户账号
  const userList = [
    {
      username: '111111',
      password: 'user111',
      avatar_url: 'https://tse3.mm.bing.net/th/id/OIP.7GLMYPqMlt2LgkbPsOnDIAAAAA?rs=1&pid=ImgDetMain'
    },
    {
      username: '222222',
      password: 'user222',
      avatar_url: 'https://tse3.mm.bing.net/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?rs=1&pid=ImgDetMain'
    },
    {
      username: '333333',
      password: 'user333',
      avatar_url: 'https://pic2.zhimg.com/v2-ffdbbeea7a8063dd40a1e80a7c023b71_b.jpg'
    }
  ];

  for (const user of userList) {
    const existing = await User.findOne({ where: { username: user.username } });
    if (!existing) {
      const hashed = await bcrypt.hash(user.password, 10);
      await User.create({
        username: user.username,
        password: hashed,
        avatar_url: user.avatar_url
      });
      console.log(`插入用户：${user.username}`);
    } else {
      console.log(`已存在，跳过：${user.username}`);
    }
  }

  console.log('\n初始化完成');
  process.exit();
}

insertAccounts();
