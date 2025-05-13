const express = require('express');
const router = express.Router();
// const auth = require('../middleware/auth');
const Diary = require('../models/travel_diaries');
const { Op } = require('sequelize');
const { auth, staffAuth, userAuth ,adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型选择不同的存储目录
    let uploadDir;
    if (file.mimetype.startsWith('video/')) {
      uploadDir = 'uploads/diaries/videos';
    } else {
      uploadDir = 'uploads/diaries/images';
    }
    
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
    fileSize: 100 * 1024 * 1024 // 限制100MB
  },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = [
      // 图片类型
      'image/jpeg',
      'image/png',
      'image/gif',
      // 视频类型
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取所有游记列表
// GET /api/diaries
// Query参数：
// - status: 可选，游记状态
// router.get('/', auth, async (req, res) => {//其中auth是基础认证中间件，staffAuth是工作人员认证中间件
router.get('/', staffAuth, async (req, res) => {
  const { status } = req.query;
  const where = { is_deleted: false };
  if (status) where.status = status;
  const diaries = await Diary.findAll({ where });
  res.json(diaries);
});

// 获取单个游记详情
// GET /api/diaries/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { 
        id: req.params.id,
        is_deleted: false 
      }
    });

    if (!diary) {
      return res.status(404).json({ msg: '游记不存在' });
    }

    res.json(diary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

//搜索游记： POST /api/diaries/search
//   "status": "approved",        // 游记状态为已审核
//   "is_deleted": 0,       // 未删除删除
//   "user_id",           // 用户ID待查
// 请求参数，在请求体里面
// {
//   "start_date": "2024-01-01", // 可选，开始日期
//   "end_date": "2024-03-20",   // 可选，结束日期
//   "page": 1,                // 可选，页码，默认1
//   "page_size": 10,          // 可选，每页数量，默认10
//   "keyword": "关键词",       // 可选，搜索标题或内容的关键词
//   "search_fields": ["title", "content"] // 可选，指定搜索字段，默认同时搜索标题和内容
// }
router.post('/search', auth, async (req, res) => {
  try {
    const { 
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      keyword,
      search_fields = ['title', 'content','user_id']
    } = req.body;

    // 构建查询条件
    const where = {
      status : 'approved',
      is_deleted: 0
    };
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [start_date, end_date]
      };
    }

    // 添加关键字搜索条件
    if (keyword) {
      where[Op.or] = search_fields.map(field => ({
        [field]: {
          [Op.like]: `%${keyword}%`
        }
      }));
    }

    // 执行查询
    const { count, rows } = await Diary.findAndCountAll({
      where,
      limit: page_size,
      offset: (page - 1) * page_size,
      order: [['created_at', 'DESC']]
    });

    res.json({
      total: count,
      page,
      page_size,
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});



// 上传游记
// POST /api/diaries/upload
// Content-Type: multipart/form-data
// 参数：
// - title: 游记标题
// - content: 游记内容
// - images: 图片文件（多文件）
// - video: 视频文件（可选）
router.post('/upload', userAuth, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // 处理图片文件
    const images = req.files.images ? 
      req.files.images.map(file => `/uploads/diaries/images/${file.filename}`) : [];
    
    // 处理视频文件
    const videoUrl = req.files.video ? 
      `/uploads/diaries/videos/${req.files.video[0].filename}` : null;

    if (!title || !content) {
      return res.status(400).json({ msg: '标题和内容不能为空' });
    }

    if (images.length === 0) {
      return res.status(400).json({ msg: '至少需要上传一张图片' });
    }

    // 计算第一张图片的宽高比
    let firstImageRatio = null;
    if (images.length > 0) {
      const sharp = require('sharp');
      const imagePath = path.join(__dirname, '..', images[0]);
      const metadata = await sharp(imagePath).metadata();
      firstImageRatio = metadata.width / metadata.height;
    }

    const diary = await Diary.create({
      user_id: req.user.id,
      title,
      content,
      images,
      video_url: videoUrl,
      first_image_ratio: firstImageRatio,
      status: 'pending'
    });

    res.status(201).json({
      msg: '游记上传成功',
      diary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 1. 获取待审核游记列表（仅admin和reviewer）todo..............................................................
router.get('/review-list', staffAuth, async (req, res) => {
  try {
    const diaries = await Diary.findAll({
      where: { status: 'pending', is_deleted: false }
    });
    res.json(diaries);
  } catch (err) {
    res.status(500).json({ msg: '服务器错误' });
  }
});

//2.审核游记 路径： POST /api/diaries/:id/review
// 请求参数，在请求体里面
// {
//   "action": "approve",     // 必填，操作类型：approve（通过）或 reject（拒绝）
//   "reason": "拒绝原因"     // 当 action 为 reject 时必填
// }

// 4. 获取所有已审核游记（任何人都能访问）//todo..............................................................
router.get('/approved-list', async (req, res) => {
  try {
    const diaries = await Diary.findAll({
      where: { status: 'approved', is_deleted: false }
    });
    res.json(diaries);
  } catch (err) {
    res.status(500).json({ msg: '服务器错误' });
  }
});

router.post('/:id/review', staffAuth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const { id } = req.params;

    // 首先检查游记是否存在且处于待审核状态
    const diary = await Diary.findOne({
      where: { 
        id,
        status: 'pending',
        is_deleted: 0
      }
    });

    if (!diary) {
      return res.status(404).json({ msg: '游记不存在或不是待审核状态' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ msg: '无效的操作类型' });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ msg: '拒绝时必须提供原因' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reject_reason: action === 'reject' ? reason : null
    };

    await Diary.update(updateData, { where: { id } });
    res.json({ msg: action === 'approve' ? '审核通过' : '审核拒绝' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 3. 逻辑删除游记（仅admin）
router.patch('/:id/delete', adminAuth, async (req, res) => {
  try {
    await Diary.update({ is_deleted: 1 }, { where: { id: req.params.id } });
    res.json({ msg: '逻辑删除成功' });
  } catch (err) {
    res.status(500).json({ msg: '服务器错误' });
  }
});
module.exports = router;
