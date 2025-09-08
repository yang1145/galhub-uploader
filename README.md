# GalHub 游戏提交平台

这是一个基于 Node.js 和 SQLite 的游戏提交平台，允许用户提交游戏信息并存储在 SQLite 数据库中。

## 功能特点

- 提交游戏信息（游戏名、作者、联系方式、下载链接等）
- 标记游戏类型（商业游戏、转载游戏）
- 数据存储在 SQLite 数据库中
- 提供简单的前端界面进行游戏提交和浏览
- 管理后台，允许管理员登录查看所有已提交的游戏
- 提交成功后跳转到成功页面

## 安装和运行

1. 确保你已经安装了 Node.js

2. 安装依赖包：
   ```
   npm install
   ```

3. 启动服务器：
   ```
   npm start
   ```

4. 在浏览器中访问 `http://localhost:3000`

## 默认管理员账户

系统内置默认管理员账户：
- 用户名：`admin`
- 密码：`admin123`

请在生产环境中及时修改默认密码。

## API 接口

### 用户接口

#### 获取所有游戏
```
GET /api/games
```

#### 提交游戏
```
POST /api/games
```

参数：
- `game_name` (必需) - 游戏名称
- `author` (必需) - 作者
- `contact` (必需) - 联系方式
- `download_link` (必需) - 下载链接
- `is_commercial` (可选) - 是否为商业游戏 (默认: false)
- `is_repost` (可选) - 是否为转载游戏 (默认: false)

#### 获取特定游戏
```
GET /api/games/:id
```

### 管理员接口

#### 管理员登录
```
POST /api/admin/login
```

参数：
- `username` - 管理员用户名
- `password` - 管理员密码

#### 获取所有游戏（管理员）
```
GET /api/admin/games
```

参数：
- `search` (可选) - 搜索关键词

需要在请求头中添加认证信息：
```
Authorization: Bearer <token>
```

## 页面说明

1. 首页 (`/`) - 游戏提交表单
2. 提交成功页面 (`/success.html`) - 用户提交游戏成功后显示的页面
3. 管理员登录页面 (`/admin.html`) - 管理员登录入口
4. 管理仪表板 (`/admin-dashboard.html`) - 管理员查看所有提交游戏的页面

## 数据库结构

游戏信息存储在 SQLite 数据库中，包含以下表：

### games 表

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| game_name | TEXT | 游戏名称 |
| author | TEXT | 作者 |
| contact | TEXT | 联系方式 |
| download_link | TEXT | 下载链接 |
| is_commercial | BOOLEAN | 是否为商业游戏 |
| is_repost | BOOLEAN | 是否为转载游戏 |
| created_at | DATETIME | 创建时间 |

### admins 表

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 管理员用户名 |
| password | TEXT | 加密后的密码 |
| created_at | DATETIME | 创建时间 |

## 故障排除

### 404 Not Found 错误

如果访问管理页面时出现 404 错误，请确保：

1. 文件名正确：
   - 登录页面：`admin.html`
   - 管理仪表板：`admin-dashboard.html`

2. 从首页访问管理功能：
   - 首页有"管理员登录"链接，点击进入登录页面

### 登录问题

1. 使用默认管理员账户：
   - 用户名：`admin`
   - 密码：`admin123`

2. 登录成功后会自动跳转到管理仪表板

3. 如果登录后仍然跳回登录页面，可能是：
   - 浏览器禁用了 localStorage
   - 服务器未正确生成 token

## 许可证

MIT