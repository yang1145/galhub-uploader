const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建或连接到SQLite数据库
const db = new sqlite3.Database('./games.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the games database.');
  }
});

// 创建游戏表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    author TEXT NOT NULL,
    contact TEXT NOT NULL,
    download_link TEXT NOT NULL,
    is_commercial BOOLEAN NOT NULL DEFAULT 0,
    is_repost BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Games table ready.');
    }
  });

  // 创建管理员表
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating admins table:', err.message);
    } else {
      console.log('Admins table ready.');
    }
  });

  // 添加默认管理员账户 (用户名: admin, 密码: admin123)
  const bcrypt = require('bcryptjs');
  const saltRounds = 10;
  const defaultPassword = 'admin123';
  const defaultUsername = 'admin';
  
  bcrypt.hash(defaultPassword, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing default password:', err.message);
      return;
    }
    
    const insertAdmin = db.prepare(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`);
    insertAdmin.run([defaultUsername, hash], (err) => {
      if (err) {
        console.error('Error inserting default admin:', err.message);
      } else {
        console.log('Default admin account ready.');
      }
    });
    insertAdmin.finalize();
  });
});

module.exports = db;