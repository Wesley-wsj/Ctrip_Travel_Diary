# 🗺️ 旅游日记 -  Travel Diary

基于 Taro 3.6.37的移动端游记应用

## 🚀 开发准备

### 环境要求

- Node.js ≥ 18.8
- Taro CLI 3.6.37
- 微信开发者工具3.8.3

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
## 🚀 用户移动端
#### 游记列表瀑布流页面（首页）：
<img src="/images/首页瀑布流片段.jpg" width="300" />

<table>
  <tr>
    <th style="text-align:center"><h4>触底加载</h4></th>
    <th style="text-align:center"><h4>点击悬浮按钮回到顶部</h4></th>
  </tr>
  <tr>
    <td><img src="/images/触底加载.gif" alt="触底加载" width="300"></td>
    <td><img src="/images/回到顶部.gif" alt="回到顶部" width="300"></td>
  </tr>
</table>

<table>
  <tr>
    <th style="text-align:center"><h4>搜索作者</h4></th>
    <th style="text-align:center"><h4>搜索标题</h4></th>
  </tr>
  <tr>
    <td><img src="/images/搜索作者.gif" alt="搜索作者" width="300"></td>
    <td><img src="/images/搜索标题.gif" alt="搜索标题" width="300"></td>
  </tr>
</table>

#### 游记详情页面显示：
<img src="/images/游记详情页面.jpg" width="300" />

#### 视频+图片轮播效果：
<table>
  <tr>
    <th style="text-align:center"><h4>wifi自动播放</h4></th>
    <th style="text-align:center"><h4>移动网络显示视频封面</h4></th>
  </tr>
  <tr>
    <td><img src="/images/WIFI.gif" alt="WIFI" width="300"></td>
    <td><img src="/images/移动网络.gif" alt="移动网络" width="300"></td>
  </tr>
</table>

#### 分享功能：
<table>
  <tr>
    <th style="text-align:center"><h4>游记详情分享承接页</h4></th>
    <th style="text-align:center"><h4>微信小程序分享演示</h4></th>
  </tr>
  <tr>
    <td><img src="/images/游记分享承接页.jpg" alt="分享承接页" width="300"></td>
    <td><img src="/images/微信小程序分享.gif" alt="小程序分享" width="300"></td>
  </tr>
</table>

#### 用户空间页显示：
<img src="/images/用户空间页面.jpg" width="300" />

#### 登陆与注册
<table>
  <tr>
    <th style="text-align:center"><h4>登陆</h4></th>
    <th style="text-align:center"><h4>注册</h4></th>
  </tr>
  <tr>
    <td><img src="/images/登陆.gif" alt="登陆" width="300"></td>
    <td><img src="/images/登陆注册.gif" alt="注册" width="300"></td>
  </tr>
</table>

#### 我的主页瀑布显示+游记状态显示（我的主页）：
<img src="/images/我的主页.png" width="300" />

#### 发布功能：
<img src="/images/发布.gif" width="300" />

## 🚀 后端及PC审核端

#### 前端登录页面：
![image](/images/前端登录界面.png)
#### 游记列表页面：
![image](/images/游记列表.png)
#### 游记详情页面：
![image](/images/游记详情.png)
#### 游记审核逻辑：
![image](/images/游记审核逻辑.png)

### 游记数据库字段
| 字段名              | 类型            | 说明                                         |
|--------------------|-----------------|--------------------------------------------|
| id                 | INT PK AUTO     | 游记主键                                     |
| user_id            | INT FK          | 发布人 `users.id`                           |
| username           | VARCHAR(50)     | 发布人昵称                                   |
| avatar_url         | TEXT            | 发布人头像 URL                               |
| title              | VARCHAR(100)    | 游记标题                                     |
| content            | TEXT            | 游记文字内容                                 |
| images             | JSON            | 多张图片 URL 列表                            |
| video_url          | TEXT            | 视频 URL                                     |
| status             | ENUM            | 状态：`pending` / `approved` / `rejected`    |
| reject_reason      | TEXT            | 审核拒绝原因（仅状态为 rejected 时填写）      |
| is_deleted         | BOOLEAN         | 是否逻辑删除                                 |
| created_at         | DATETIME        | 创建时间                                     |
| first_image_ratio  | DECIMAL(5, 2)   | 第一张图片宽高比（宽 / 高）                  |
| cover              | VARCHAR(255)    | 视频第一帧图片相对路径                       |
| location           | JSON            | 地点列表                                     |
| departure_time     | VARCHAR(50)     | 出发时间（字符串，例如 '2025-05-12'）        |
| avg_cost           | DECIMAL(10, 2)  | 人均花费金额                                 |
| companions         | VARCHAR(50)     | 与谁出行                                     |
| days               | DECIMAL(4, 1)   | 行程天数，支持小数 
    

### 安装与运行
#### 后端数据库与接口
    cd backed
    npm install
    node app.js
#### PC端审核系统
    cd frontend-audit-system
    npm install react react-dom react-router-dom axios antd vite @vitejs/plugin-react --save-dev
    npm run dev
    登录网址：http://localhost:3000/login

