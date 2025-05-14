# 🗺️ 游记日记 -  Travel Diary

基于 Taro 3.6.37的移动端游记应用

## 🚀 开发准备

### 环境要求

- Node.js ≥ 18.8
- Taro CLI 3.6.37
- 微信开发者工具3.8.3
-

### 关键扩展库

miniprogram-formdata@^2.0.0 # 表单数据处理

### 安装与运行

```bash
# 全局安装 CLI
npm install -g @tarojs/cli@3.6.37
# 安装指定 Node 版本
nvm install 18.18.2

# 安装依赖
$ npm install

# 生产构建
$ npm run build:weapp  # 微信小程序生产包

```

后端数据库的搭建和后端接口：
首先对应的数据库创建命令，
#### sql代码
    create database audit_system;
    USE audit_system;
    CREATE TABLE staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(128) NOT NULL,
        role ENUM('admin', 'reviewer') NOT NULL DEFAULT 'reviewer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(128) NOT NULL,
        avatar_url TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE travel_diaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        avatar_url TEXT DEFAULT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        images JSON NOT NULL,  -- 存储多张图片的 URL 列表
        video_url TEXT DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        reject_reason TEXT DEFAULT NULL,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        first_image_ratio DATETIME DEFAULT CURRENT_TIMESTAMP

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ALTER TABLE audit_system.travel_diaries
    ADD COLUMN cover VARCHAR(255) DEFAULT NULL COMMENT '视频第一帧图片相对路径',
    ADD COLUMN location JSON DEFAULT NULL COMMENT '地点列表',
    ADD COLUMN departure_time VARCHAR(50) DEFAULT NULL COMMENT '出发时间',
    ADD COLUMN avg_cost DECIMAL(10, 2) DEFAULT NULL COMMENT '人均花费',
    ADD COLUMN companions VARCHAR(50) DEFAULT NULL COMMENT '与谁出行',
    ADD COLUMN days DECIMAL(4, 1) DEFAULT NULL COMMENT '行程天数，支持小数';
    
后端接口文件所需环境
    cd backed
    npm install express sequelize mysql2 jsonwebtoken bcryptjs multer sharp body-parser cors dotenv fluent-ffmpeg sharp
    node app.js
前端审核系统所需环境
    npm install react react-dom react-router-dom axios antd vite @vitejs/plugin-react --save-dev
    npm run dev 
# 前端审核系统启动开发服务：http://localhost:3000
在浏览器输入http://localhost:3000/login进行登录

