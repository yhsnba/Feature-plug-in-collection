# 🔧 故障排除指南

## ❌ 常见问题和解决方案

### 1. 🚨 API连接失败 / 图片上传不工作

**问题症状:**
- 页面加载正常，但上传图片时显示"连接失败"
- 控制台显示网络错误或404错误
- 功能按钮无响应

**原因:**
只启动了前端服务器，没有启动后端API服务器

**❌ 错误的启动方式:**
```bash
npm run dev  # 只启动前端，后端API不可用
```

**✅ 正确的解决方案:**
```bash
# 方案1: 推荐 - 一键启动前后端
npm start

# 方案2: 分别启动 (需要两个终端)
# 终端1:
npm run server

# 终端2:
npm run dev
```

### 2. 🔌 端口被占用

**问题症状:**
- 启动时提示端口被占用
- 服务器无法启动

**解决方案:**
```bash
# 查看端口占用情况
netstat -ano | findstr :3004
netstat -ano | findstr :5175

# 杀死占用端口的进程
taskkill /F /PID <进程ID>

# 或者重启电脑
```

### 3. 📦 依赖安装问题

**问题症状:**
- npm start 报错
- 模块找不到

**解决方案:**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 或者使用yarn
yarn install
```

### 4. 🖼️ 图片处理失败

**问题症状:**
- 图片上传成功但处理失败
- Sharp相关错误

**解决方案:**
```bash
# 重新安装Sharp
npm uninstall sharp
npm install sharp

# 如果还有问题，尝试
npm install --platform=win32 --arch=x64 sharp
```

### 5. 🌐 浏览器缓存问题

**问题症状:**
- 界面显示异常
- 功能不正常

**解决方案:**
- 按 Ctrl+F5 强制刷新
- 清除浏览器缓存
- 使用无痕模式测试

## 🚀 快速启动检查清单

在启动项目前，请确认：

- [ ] 已安装 Node.js 16+
- [ ] 已运行 `npm install`
- [ ] 端口3004和5175没有被占用
- [ ] 使用 `npm start` 而不是 `npm run dev`
- [ ] 等待"服务器运行在 http://localhost:3004"消息出现

## 📞 获取帮助

如果问题仍然存在：

1. 检查控制台错误信息
2. 查看终端输出日志
3. 确认网络连接正常
4. 重启项目和浏览器

## 🔍 调试技巧

### 检查服务器状态
```bash
# 测试后端API
curl http://localhost:3004/api/health

# 测试前端
curl http://localhost:5175
```

### 查看详细日志
在浏览器开发者工具的Console标签页中查看详细错误信息。

### 重置项目状态
```bash
# 停止所有服务
Ctrl+C

# 清理临时文件
npm run clean

# 重新启动
npm start
```
