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

// 修改管理员密码
const changePassword = (userId, currentPassword, newPassword, callback) => {
  // 首先获取用户当前信息
  const sql = 'SELECT * FROM admins WHERE id = ?';
  
  db.get(sql, [userId], (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    if (!row) {
      callback(new Error('用户不存在'), null);
      return;
    }
    
    // 验证当前密码是否正确
    bcrypt.compare(currentPassword, row.password, (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      if (!result) {
        callback(new Error('当前密码错误'), null);
        return;
      }
      
      // 加密新密码
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          callback(err, null);
          return;
        }
        
        // 更新密码
        const updateSql = 'UPDATE admins SET password = ? WHERE id = ?';
        db.run(updateSql, [hash, userId], (err) => {
          if (err) {
            callback(err, null);
            return;
          }
          
          callback(null, { message: '密码修改成功' });
        });
      });
    });
  });
};

module.exports = {
  login,
  verifyToken,
  getAllGames,
  changePassword
};