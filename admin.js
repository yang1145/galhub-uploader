const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

// JWT 密钥
const JWT_SECRET = 'galhub_admin_secret_key';

// 管理员登录验证
const login = (username, password, callback) => {
  const sql = 'SELECT * FROM admins WHERE username = ?';
  
  db.get(sql, [username], (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    if (!row) {
      callback(new Error('用户名或密码错误'), null);
      return;
    }
    
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      if (!result) {
        callback(new Error('用户名或密码错误'), null);
        return;
      }
      
      // 生成 JWT token
      const token = jwt.sign(
        { id: row.id, username: row.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      callback(null, { token });
    });
  });
};

// 验证管理员 token
const verifyToken = (token, callback) => {
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    callback(null, decoded);
  });
};

// 获取所有游戏（带搜索功能）
const getAllGames = (search, callback) => {
  let sql = 'SELECT * FROM games';
  const params = [];
  
  if (search) {
    sql += ' WHERE game_name LIKE ? OR author LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    callback(null, rows);
  });
};

module.exports = {
  login,
  verifyToken,
  getAllGames
};