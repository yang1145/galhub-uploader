const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const admin = require('./admin');
const svgCaptcha = require('svg-captcha');

const app = express();
const port = 3000;

// 使用body-parser中间件解析POST请求数据
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 设置静态文件目录
app.use(express.static('public'));

// 添加会话支持
app.use((req, res, next) => {
  // 简单的内存会话实现
  req.sessionId = req.headers['x-session-id'] || Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Session-ID', req.sessionId);
  
  // 使用全局对象存储会话数据
  if (!global.sessions) {
    global.sessions = {};
  }
  
  if (!global.sessions[req.sessionId]) {
    global.sessions[req.sessionId] = {};
  }
  
  req.session = global.sessions[req.sessionId];
  next();
});

// 路由：生成验证码
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
    color: true
  });
  
  // 将验证码文本存储在会话中，用于验证
  req.session.captcha = captcha.text.toLowerCase();
  
  // 返回验证码SVG图像
  res.type('svg');
  res.status(200).send(captcha.data);
});

// 路由：获取所有游戏
app.get('/api/games', (req, res) => {
  const sql = 'SELECT * FROM games ORDER BY created_at DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// 路由：提交游戏
app.post('/api/games', (req, res) => {
  const { 
    game_name, 
    author, 
    contact, 
    download_link, 
    is_commercial = false, 
    is_repost = false,
    captcha
  } = req.body;

  // 验证验证码
  if (!captcha) {
    res.status(400).json({
      error: '请输入验证码'
    });
    return;
  }

  // 检查验证码
  if (!req.session.captcha || captcha.toLowerCase() !== req.session.captcha) {
    res.status(400).json({
      error: '验证码错误'
    });
    return;
  }
  
  // 验证通过后清除验证码，防止重复使用
  delete req.session.captcha;
  
  // 验证必填字段
  if (!game_name || !author || !contact || !download_link) {
    res.status(400).json({
      error: '游戏名、作者、联系方式和下载链接是必填项'
    });
    return;
  }

  const sql = `INSERT INTO games 
    (game_name, author, contact, download_link, is_commercial, is_repost) 
    VALUES (?, ?, ?, ?, ?, ?`;

  db.run(sql, [
    game_name, 
    author, 
    contact, 
    download_link, 
    is_commercial ? 1 : 0, 
    is_repost ? 1 : 0
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      message: '游戏提交成功',
      data: {
        id: this.lastID,
        game_name,
        author,
        contact,
        download_link,
        is_commercial,
        is_repost
      }
    });
  });
});

// 路由：根据ID获取特定游戏
app.get('/api/games/:id', (req, res) => {
  const sql = 'SELECT * FROM games WHERE id = ?';
  const id = req.params.id;

  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '未找到该游戏' });
      return;
    }
    res.json({
      message: 'success',
      data: row
    });
  });
});

// 管理员身份验证中间件
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
    return res.status(401).json({ error: '无效的访问令牌格式' });
  }

  admin.verifyToken(tokenParts[1], (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: '无效的访问令牌' });
    }
    req.user = decoded;
    next();
  });
};

// 管理员修改密码路由
app.post('/api/admin/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  // 验证新密码长度
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }
  
  admin.changePassword(userId, currentPassword, newPassword, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

// 管理员获取游戏列表路由
app.get('/api/admin/games', authenticateAdmin, (req, res) => {
  const search = req.query.search || '';
  
  admin.getAllGames(search, (err, games) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      message: 'success',
      data: games
    });
  });
});

// 管理员登录路由
app.post('/api/admin/login', (req, res) => {
  const { username, password, captcha } = req.body;
  
  // 验证验证码
  if (!captcha) {
    res.status(400).json({
      error: '请输入验证码'
    });
    return;
  }
  
  // 检查验证码
  if (!req.session.captcha || captcha.toLowerCase() !== req.session.captcha) {
    res.status(400).json({
      error: '验证码错误'
    });
    return;
  }
  
  // 验证通过后清除验证码
  delete req.session.captcha;
  
  admin.login(username, password, (err, result) => {
    if (err) {
      res.status(401).json({
        error: err.message
      });
    } else {
      res.json({
        message: 'success',
        data: result
      });
    }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});