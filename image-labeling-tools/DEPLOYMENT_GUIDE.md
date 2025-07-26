# 🚀 图像标注工具集 - 甲方部署指南

## 📋 概述

本文档为甲方提供完整的部署指南，帮助您快速部署和使用图像标注工具集。

## 🎯 系统特性

### 核心功能
- **项目管理**: 创建和管理多个标注项目
- **甲方管理**: 管理客户信息和项目需求
- **三大工具**: Flux拼接、Kontext标注、专业标注
- **部署管理**: 一键部署到不同环境
- **数据持久化**: 项目和配置数据自动保存

### 技术栈
- **前端**: React 18 + Vite
- **后端**: Node.js + Express
- **图像处理**: Sharp
- **容器化**: Docker + Docker Compose

## 🔧 环境要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

### 推荐配置
- **CPU**: 4核心或更多
- **内存**: 8GB RAM 或更多
- **存储**: 50GB SSD
- **网络**: 稳定的互联网连接

### 软件依赖
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Git**: 2.30+ (可选)

## 📦 快速部署

### 方式一：Docker Compose (推荐)

1. **下载项目文件**
   ```bash
   # 如果有Git
   git clone https://github.com/yhsnba/Feature-plug-in-collection.git
   cd Feature-plug-in-collection/image-labeling-tools
   
   # 或者直接下载ZIP文件并解压
   ```

2. **启动服务**
   ```bash
   # 一键启动所有服务
   docker-compose up -d
   
   # 查看服务状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

3. **访问应用**
   - 前端界面: http://localhost:5174
   - 后端API: http://localhost:3004

### 方式二：本地安装

1. **安装Node.js**
   - 下载并安装 Node.js 16+ 
   - 验证安装: `node --version`

2. **安装依赖**
   ```bash
   cd image-labeling-tools
   npm install
   ```

3. **启动应用**
   ```bash
   # 同时启动前端和后端
   npm start
   
   # 或分别启动
   npm run server  # 后端 (端口3004)
   npm run dev     # 前端 (端口5174)
   ```

## 🔐 安全配置

### 环境变量配置

创建 `.env` 文件：
```bash
# 服务器配置
PORT=3004
NODE_ENV=production

# 前端配置
VITE_API_BASE_URL=http://your-domain.com:3004/api

# 安全配置
CORS_ORIGIN=http://your-domain.com:5174

# 文件上传配置
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
```

### 防火墙设置

确保以下端口开放：
- **5174**: 前端访问端口
- **3004**: 后端API端口

### SSL证书 (生产环境推荐)

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

## 🌐 域名配置

### 1. 域名解析
将您的域名A记录指向服务器IP地址

### 2. Nginx反向代理 (推荐)

创建 `/etc/nginx/sites-available/image-labeling-tools`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端
    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 文件上传
    location /uploads {
        proxy_pass http://localhost:3004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/image-labeling-tools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 使用指南

### 1. 首次访问

1. 打开浏览器访问 http://your-domain.com:5174
2. 进入项目管理界面
3. 创建第一个甲方客户
4. 创建第一个项目

### 2. 项目管理

**创建甲方**:
- 点击"添加甲方"
- 填写客户信息
- 保存客户资料

**创建项目**:
- 点击"新建项目"
- 选择甲方客户
- 配置项目类型和工具
- 设置项目参数

**使用工具**:
- 点击项目卡片的"打开项目"
- 选择需要的标注工具
- 开始图像处理和标注

### 3. 部署管理

**创建部署配置**:
- 进入"部署管理"页面
- 点击"新建部署"
- 配置部署环境
- 一键部署到目标环境

## 🔧 维护和监控

### 日志查看

```bash
# Docker环境
docker-compose logs -f app

# 本地环境
npm run server  # 查看后端日志
```

### 数据备份

重要数据位置：
- **项目数据**: `server/data/projects.json`
- **甲方数据**: `server/data/clients.json`
- **上传文件**: `uploads/` 目录

备份命令：
```bash
# 创建备份
tar -czf backup-$(date +%Y%m%d).tar.gz server/data uploads

# 恢复备份
tar -xzf backup-20240101.tar.gz
```

### 性能优化

1. **定期清理上传文件**
   ```bash
   # 清理30天前的文件
   find uploads -type f -mtime +30 -delete
   ```

2. **监控磁盘空间**
   ```bash
   df -h
   ```

3. **监控内存使用**
   ```bash
   docker stats  # Docker环境
   htop          # 本地环境
   ```

## 🆘 故障排除

### 常见问题

**1. 无法访问前端界面**
- 检查端口5174是否开放
- 确认服务是否正常启动
- 查看防火墙设置

**2. API连接失败**
- 检查后端服务状态
- 确认端口3004是否开放
- 检查CORS配置

**3. 文件上传失败**
- 检查uploads目录权限
- 确认磁盘空间充足
- 检查文件大小限制

**4. Docker启动失败**
- 检查Docker服务状态
- 确认端口未被占用
- 查看Docker日志

### 获取支持

如遇到技术问题，请提供以下信息：
- 操作系统版本
- 错误日志
- 复现步骤
- 系统配置

联系方式：
- 邮箱: 3027681288@qq.com
- GitHub: https://github.com/yhsnba/Feature-plug-in-collection

## 📈 扩展功能

### 集群部署

对于大规模使用，可以考虑：
- 负载均衡器
- 数据库集群
- 分布式文件存储
- 容器编排 (Kubernetes)

### 自定义开发

系统支持二次开发：
- 添加新的标注工具
- 自定义工作流程
- 集成第三方服务
- 定制化界面

---

**图像标注工具集** - 让图像标注工作更高效、更专业！🚀
