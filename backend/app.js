const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sequelize = require('./config/db');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/diaries', require('./routes/diary_2'));
app.use('/api/users', require('./routes/user'));
app.use('/api/staff', require('./routes/auth'));

sequelize.sync().then(() => console.log('数据库连接成功'));
app.listen(5000, () => console.log('服务运行在 http://localhost:5000'));