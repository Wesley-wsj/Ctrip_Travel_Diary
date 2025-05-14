const express = require('express');
const router = express.Router();
const Diary = require('../models/travel_diaries');
const { Op } = require('sequelize');
const { auth, staffAuth, userAuth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

// 获取服务器基础URL
const getBaseUrl = (req) => {
  const host = req.get('host');
  // 如果路径以 .. 开头，则移除它
  return `${req.protocol}://${host}`;
};

// 处理图片和视频URL
const processMediaUrls = (diary, req) => {
  const baseUrl = getBaseUrl(req);
  
  // 处理图片数组
  if (diary.images && Array.isArray(diary.images)) {
    diary.images = diary.images.map(img => {
      // 如果已经是完整URL则直接返回
      if (img.startsWith('http')) return img;
      return `${baseUrl}${img.substring(2)}`;
    });
  }

  if(diary.avatar_url){
    if(!diary.avatar_url.startsWith('http')){
      diary.avatar_url = `${baseUrl}${diary.avatar_url.substring(2)}`;
    }
  }

  // 处理视频URL
  if (diary.video_url) {
    // 如果已经是完整URL则直接返回
    if (!diary.video_url.startsWith('http')) {
      diary.video_url = `${baseUrl}${diary.video_url.substring(2)}`;
    }
  }

  // 处理封面URL
  if (diary.cover) {
    if (!diary.cover.startsWith('http')) {
      diary.cover = `${baseUrl}${diary.cover.substring(2)}`;
    }
  }

  return diary;
};

// 处理多个游记的媒体URL
const processMultipleDiaries = (diaries, req) => {
  if (Array.isArray(diaries)) {
    return diaries.map(diary => processMediaUrls(diary, req));
  }
  return processMediaUrls(diaries, req);
};

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('原始文件名:', file.originalname);  // 打印原始文件名

    let uploadDir;

    if (file.mimetype.startsWith('video/')) {
      uploadDir = '../uploads/diaries/videos';
    } else if (file.mimetype.startsWith('image/')) {
      // // 如果是视频封面，存储到 covers 目录
      // if (req.body.type === 'cover') {
      //   uploadDir = '../uploads/diaries/covers';
      // } else {
      //   uploadDir = '../uploads/diaries/images';
      // }
      uploadDir = '../uploads/diaries/images';
    } else {
      return cb(new Error('不支持的文件类型'));
    }
    
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
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});


// // 配置文件上传
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     let uploadDir;
//     if (file.mimetype.startsWith('video/')) {
//       uploadDir = '../uploads/diaries/videos';
//     } else if (file.mimetype.startsWith('image/')) {
//       uploadDir = '../uploads/diaries/images';
//     } else {
//       return cb(new Error('不支持的文件类型'));
//     }
    
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });


  
// 11.获取用户所有游记（需要用户认证）
router.get('/my-diaries', userAuth, async (req, res) => {
  try {
    const diaries = await Diary.findAll({
      where: { 
        user_id: req.user.id
      },
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedDiaries = processMultipleDiaries(diaries, req);

    res.json(processedDiaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 1. 获取所有游记（含待审核，需要工作人员认证）
router.get('/', staffAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = { is_deleted: 0 };
    if (status) where.status = status;
    const diaries = await Diary.findAll({ 
      where,
      order: [['id', 'ASC']]
    });
    res.json(processMultipleDiaries(diaries, req));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// // 2. 获取待审核游记列表（需要工作人员认证）
// router.get('/review-list', staffAuth, async (req, res) => {
//   try {
//     const diaries = await Diary.findAll({
//       where: { 
//         status: 'pending',
//         is_deleted: 0
//       }
//     });
//     res.json(processMultipleDiaries(diaries, req));
//   } catch (err) {
//     res.status(500).json({ msg: '服务器错误' });
//   }
// });

// 2. 获取待审核游记列表（工作人员认证）
router.get('/review-list', staffAuth, async (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;

    const { count, rows } = await Diary.findAndCountAll({
      where: { 
        status: 'pending',
        is_deleted: false
      },
      limit: parseInt(page_size),
      offset: offset,
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 2.5 获取拒绝游记列表（工作人员认证）
router.get('/rejected-list', staffAuth, async (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;

    const { count, rows } = await Diary.findAndCountAll({
      where: { 
        status: 'rejected',
        is_deleted: false
      },
      limit: parseInt(page_size),
      offset: offset,
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});


// 2.6 根据关键词搜索游记（管理员可搜索用户名、标题、内容中的关键字，需要认证）
router.post('/reviewer-search',staffAuth, async (req, res) => {
  try {
    const { 
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      keyword,
      last_id,
      status,
      is_deleted,
      search_fields = ['title', 'content', 'user_id']
    } = req.body;

    // 初始化 where 对象
    const where = {};

    // 只有当明确指定了 is_deleted 时才添加过滤条件
    if (is_deleted) {
      where.is_deleted = is_deleted;
    }

    // 只有当明确指定了 status 时才添加过滤条件
    if (status) {
      where.status = status;
    }

    if (last_id) {
      where.id = {
        [Op.gt]: parseInt(last_id)
      };
    }

    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [start_date, end_date]
      };
    }

    if (keyword) {
      where[Op.or] = search_fields.map(field => ({
        [field]: {
          [Op.like]: `%${keyword}%`
        }
      }));
    }

    const { count, rows } = await Diary.findAndCountAll({
      where,
      limit: parseInt(page_size),
      offset: last_id ? 0 : (page - 1) * parseInt(page_size),
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      has_more: rows.length === parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 2.7 管理员恢复逻辑删除游记（需要管理员认证）
router.patch('/:id/recover', adminAuth, async (req, res) => {
  try {
    // 先查找游记
    const diary = await Diary.findOne({
      where: { id: req.params.id }
    });

    // 验证游记是否存在
    if (!diary) {
      return res.status(404).json({ msg: '游记不存在' });
    }

    // 验证游记是否已经被删除
    if (!diary.is_deleted) {
      return res.status(400).json({ msg: '游记未被逻辑删除' });
    }

    // 执行逻辑恢复
    await Diary.update(
      { is_deleted: 0 ,
        status: 'pending'//状态变为待审核
      }, 
      { where: { id: req.params.id } }
    );
    
    res.json({ msg: '逻辑恢复成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 2.8 获取拒绝游记列表（工作人员认证）
router.get('/deleted-list', staffAuth, async (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;

    const { count, rows } = await Diary.findAndCountAll({
      where: { 
        // status: 'rejected',
        is_deleted: true
      },
      limit: parseInt(page_size),
      offset: offset,
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 3. 获取已审核游记列表（不需要认证）
router.get('/approved-list', async (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;

    const { count, rows } = await Diary.findAndCountAll({
      where: { 
        status: 'approved',
        is_deleted: false
      },
      limit: parseInt(page_size),
      offset: offset,
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 4. 根据关键词搜索游记（可搜索用户名、标题、内容中的关键字，无需认证）
router.post('/search',  async (req, res) => {
  try {
    const { 
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      keyword,
      last_id,
      search_fields = ['title', 'content', 'user_id']
    } = req.body;
    const where = {
      status: 'approved',
      is_deleted: 0
    };

    if (last_id) {
      where.id = {
        [Op.gt]: parseInt(last_id)
      };
    }

    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [start_date, end_date]
      };
    }

    if (keyword) {
      where[Op.or] = search_fields.map(field => ({
        [field]: {
          [Op.like]: `%${keyword}%`
        }
      }));
    }

    const { count, rows } = await Diary.findAndCountAll({
      where,
      limit: page_size,
      offset: last_id ? 0 : (page - 1) * page_size,
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      has_more: rows.length === parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});



// 5. 创建新游记（需要用户认证）
router.post('/upload', userAuth, upload.fields([
  { name: 'images', maxCount: 9 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      title, 
      content, 
      location, 
      departure_time,
      avg_cost,
      companions,
      days 
    } = req.body;
    
    // 处理图片并计算第一张图片的宽高比
    let firstImageRatio = null;
    const images = req.files.images ? await Promise.all(req.files.images.map(async (file, index) => {
      if (index === 0) {
        try {
          const metadata = await sharp(file.path).metadata();
          firstImageRatio = metadata.width / metadata.height;
        } catch (err) {
          console.error('获取图片宽高比失败:', err);
        }
      }
      return `../uploads/diaries/images/${file.filename}`;
    })) : [];

    let videoUrl = null;
    let coverPath = null;

    // 如果上传了视频，截取第一帧作为封面
    if (req.files.video) {
      videoUrl = `../uploads/diaries/videos/${req.files.video[0].filename}`;
      
      // 生成封面文件名
      const coverFilename = `cover-${Date.now()}.jpg`;
      coverPath = `../uploads/diaries/covers/${coverFilename}`;
      
      // 确保封面目录存在
    //   const coverDir = '../uploads/diaries/covers';
        const coverDir = '/www/wwwroot/backend/uploads/diaries/covers';
      if (!fs.existsSync(coverDir)) {
        fs.mkdirSync(coverDir, { recursive: true });
      }

      // 截取视频第一帧
      await new Promise((resolve, reject) => {
        ffmpeg(req.files.video[0].path)
          .screenshots({
            timestamps: ['00:00:00'],
            filename: coverFilename,
            folder: coverDir,
            // size: '1280x720'  // 设置封面图片尺寸
          })
          .on('end', () => {
            console.log('封面截取成功');
            resolve();
          })
          .on('error', (err) => {
            console.error('封面截取失败:', err);
            reject(err);
          });
      });
    }

    if (!title || !content) {
      return res.status(400).json({ msg: '标题和内容不能为空' });
    }

    if (images.length === 0) {
      return res.status(400).json({ msg: '至少需要上传一张图片' });
    }

    const avatar_url = '../uploads/avatar_url/' + req.user.avatar_url.split('/').slice(-1)[0];
    
    const diary = await Diary.create({
      title,
      content,
      location: location ? JSON.parse(location) : null,
      images,
      video_url: videoUrl,
      cover: coverPath,  // 添加封面路径
      user_id: req.user.id,
      username: req.user.username,
      avatar_url: avatar_url,
      status: 'pending',
    // status:"rejected",//.....................................................................//.........................
      first_image_ratio: firstImageRatio,
      departure_time,
      avg_cost: avg_cost ? parseFloat(avg_cost) : null,
      companions,
      days: days ? parseFloat(days) : null
    });

    res.status(201).json(processMultipleDiaries(diary, req));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 6. 获取单个游记详情（需要工作人员认证）
router.get('/:id', staffAuth, async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { 
        id: req.params.id,
        is_deleted: 0 
      }
    });

    if (!diary) {
      return res.status(404).json({ msg: '游记不存在' });
    }

    // 处理返回数据中的媒体URL
    const processedDiary = processMultipleDiaries(diary, req);

    res.json(processedDiary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 7. 审核游记（需要工作人员认证）
router.post('/:id/review', staffAuth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const { id } = req.params;

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


// 8. 更新待审核或已拒绝的游记，并将状态改为待审核，去除修改意见（用户认证）
router.put('/update/:id', userAuth, upload.fields([
  { name: 'images', maxCount: 9 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      title, 
      content, 
      location,
      departure_time,
      avg_cost,
      companions,
      days 
    } = req.body;

    const diary = await Diary.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id,
        is_deleted: 0,
        status: ['pending', 'rejected']
      }
    });

    if (!diary) {
      return res.status(404).json({ msg: '游记不存在或无法修改' });
    }

    const avatar_url = '../uploads/avatar_url/' + req.user.avatar_url.split('/').slice(-1)[0];
    
    const updateData = { 
      title, 
      content, 
      location: location ? JSON.parse(location) : null,
      username: req.user.username,
      avatar_url: avatar_url,
      status: 'pending',
      reject_reason: null,
      departure_time,
      avg_cost: avg_cost ? parseFloat(avg_cost) : null,
      companions,
      days: days ? parseFloat(days) : null
    };
    
    if (req.files) {
      if (req.files.images) {
        updateData.images = req.files.images.map(file => `../uploads/diaries/images/${file.filename}`);
      }
      if (req.files.video) {
        updateData.video_url = `../uploads/diaries/videos/${req.files.video[0].filename}`;
      }
    }

    await Diary.update(updateData, { where: { id: req.params.id } });
    res.json({ msg: '更新成功，等待审核' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

//8.5 获取游记状态
router.get('/:id/status', userAuth, async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id,
        is_deleted: 0
      },
      attributes: ['id', 'status', 'reject_reason', 'created_at']
    });

    if (!diary) {
      return res.status(404).json({ msg: '游记不存在或无权限查看'});
    }

    res.json({
      status: diary.status,
      reject_reason: diary.reject_reason,
      created_at: diary.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});


// 9. 删除游记（需要用户认证）
router.delete('/:id', userAuth, async (req, res) => {
    try {
      const diary = await Diary.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id
        }
      });
  
      if (!diary) {
        return res.status(404).json({ msg: '游记不存在' });
      }
  
      // 直接物理删除游记
      await Diary.destroy({ where: { id: req.params.id } });
      res.json({ msg: '删除成功' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  });


// 10. 管理员删除游记（需要管理员认证）
router.patch('/:id/delete', adminAuth, async (req, res) => {
    try {
      // 先查找游记
      const diary = await Diary.findOne({
        where: { id: req.params.id }
      });
  
      // 验证游记是否存在
      if (!diary) {
        return res.status(404).json({ msg: '游记不存在' });
      }
  
      // 验证游记是否已经被删除
      if (diary.is_deleted) {
        return res.status(400).json({ msg: '游记已经被逻辑删除' });
      }
  
      // 执行逻辑删除
      await Diary.update(
        { is_deleted: 1 }, 
        { where: { id: req.params.id } }
      );
      
      res.json({ msg: '逻辑删除成功' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  });

//   // 11.获取用户所有游记（需要用户认证）
// router.get('/my-diaries', async (req, res) => {
//   try {
//     const diaries = await Diary.findAll({
//       where: { 
//         user_id: 1, 
//         is_deleted: 0
//       },
//       order: [['id', 'ASC']]
//     });

//     // 处理返回数据中的媒体URL
//     const processedDiaries = processMultipleDiaries(diaries, req);

//     res.json(processedDiaries);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: '服务器错误' });
//   }
// });
  
  
// // 11.获取用户所有游记（需要用户认证）
// router.get('/my-diaries', userAuth, async (req, res) => {
//   try {
//     const diaries = await Diary.findAll({
//       where: { 
//         user_id: req.user.id
//       },
//       order: [['id', 'ASC']]
//     });

//     // 处理返回数据中的媒体URL
//     const processedDiaries = processMultipleDiaries(diaries, req);

//     res.json(processedDiaries);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: '服务器错误' });
//   }
// });

  
// // 11.获取用户所有游记（需要用户认证）
// router.get('/my-diaries', async (req, res) => {
//   try {
//     // 1. 获取 token
//     const token = req.headers['authorization'];
//     if (!token) return res.status(401).json({ msg: '无Token' });

//     // 2. 用 JWT_USER_SECRET 解密
//     let decoded;
//     try {
//       decoded = jwt.verify(token.split(' ')[1], process.env.JWT_USER_SECRET);
//     } catch (err) {
//       return res.status(403).json({ msg: 'Token无效或不是普通用户Token' });
//     }

//     // 3. 查找用户
//     const user = await User.findByPk(decoded.id);
//     if (!user) return res.status(403).json({ msg: '用户不存在' });

//     // 4. 查询该用户的所有游记
//     const diaries = await Diary.findAll({
//       where: { user_id: user.id },
//       order: [['id', 'ASC']]
//     });

//     // 5. 处理媒体URL
//     const processedDiaries = processMultipleDiaries(diaries, req);

//     res.json(processedDiaries);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: '服务器错误' });
//   }
// });


// // 11.5 .获取用户所有已审核的游记（不需要用户认证，用于访问个人空间）
// router.get('/diaries-approved/:userid', async (req, res) => {
//   try {
//     const diaries = await Diary.findAll({
//       where: { 
//         user_id: req.params.userid, 
//         status: 'approved', // 只获取已审核通过的游记
//         is_deleted: 0
//       },
//       order: [['id', 'ASC']]
//     });

//     // 处理返回数据中的媒体URL
//     const processedDiaries = processMultipleDiaries(diaries, req);

//     res.json(processedDiaries);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: '服务器错误' });
//   }
// });

// 11.5 .获取用户所有已审核的游记（不需要用户认证，用于访问个人空间）
router.get('/diaries-approved/:userid', async (req, res) => {
  try {
    const { page = 1, page_size = 10, last_id } = req.query;
    const where = {
      user_id: req.params.userid,
      status: 'approved',
      is_deleted: 0
    };

    if (last_id) {
      where.id = {
        [Op.gt]: parseInt(last_id)
      };
    }

    const { count, rows } = await Diary.findAndCountAll({
      where,
      limit: parseInt(page_size),
      offset: last_id ? 0 : (parseInt(page) - 1) * parseInt(page_size),
      order: [['id', 'ASC']]
    });

    // 处理返回数据中的媒体URL
    const processedRows = processMultipleDiaries(rows, req);

    res.json({
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      has_more: rows.length === parseInt(page_size),
      data: processedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 12 获取已审核游记详情（无需认证）
router.get('/approved/:id', async (req, res) => {
    try {
      const diary = await Diary.findOne({
        where: { 
          id: req.params.id,
          status: 'approved',
          is_deleted: false
        }
      });
  
      if (!diary) {
        return res.status(404).json({ msg: '游记不存在或未通过审核' });
      }
  
      // 处理返回数据中的媒体URL
      const processedDiary = processMultipleDiaries(diary, req);

      res.json(processedDiary);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
});

module.exports = router;