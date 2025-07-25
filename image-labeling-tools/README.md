# 🎨 现代化图像标注工具集

一个功能强大的Web图像标注工具集，包含三个专业的标注工具，采用现代化设计和先进技术栈。

## ✨ 功能特色

### 🖼️ Flux IC-LoRA 图像拼接工具
- **智能拼接**: 水平拼接左图与右图文件夹中的图片
- **实时预览**: 即时查看拼接效果
- **全局计数器**: 跨组保持编号连续性
- **批量处理**: 支持大量图片的批量标注
- **撤回功能**: 完整的撤回和恢复机制
- **进度跟踪**: 详细的处理进度显示

### 📷 KontextLora 标注工具
- **双图显示**: 同时显示原图和目标图
- **图像对标注**: 为图像对添加描述标签
- **键盘导航**: 支持方向键快速切换
- **自动重命名**: 智能的文件命名规则
- **固定标签**: 支持标签模板功能

### 🎨 专业标注工具
- **服装专用**: 专门针对服装图像优化
- **多字段表单**: 触发词、服装结构等多维度标注
- **自定义命名**: 灵活的文件命名规则
- **配置生成**: 自动生成标注配置文件

## 🚀 技术栈

- **前端**: React 18 + Vite + 现代CSS
- **后端**: Node.js + Express + Sharp
- **图像处理**: Sharp (高性能图像处理)
- **文件上传**: Multer + 多文件支持
- **UI设计**: 毛玻璃效果 + 渐变动画
- **响应式**: 完整的移动端适配

## 🎯 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装和启动
```bash
# 克隆项目
git clone <repository-url>
cd image-labeling-tools

# 安装依赖
npm install

# 启动应用 (前端+后端)
npm run start

# 或分别启动
npm run dev      # 前端开发服务器
npm run server   # 后端API服务器
```

### 访问应用
- **前端界面**: http://localhost:5174
- **后端API**: http://localhost:3004
- **文件服务**: http://localhost:3004/uploads

## 📁 项目结构

```
image-labeling-tools/
├── src/                           # 前端源码
│   ├── components/                # React组件
│   │   ├── FluxTool.jsx          # Flux IC-LoRA工具
│   │   ├── KontextTool.jsx       # Kontext标注工具
│   │   └── TagTool.jsx           # 专业标注工具
│   ├── services/                  # API服务层
│   │   └── api.js                # API接口封装
│   ├── utils/                     # 工具函数
│   └── App.css                   # 全局样式
├── server/                        # 后端服务
│   └── server.js                 # Express服务器
├── public/                        # 静态资源
├── uploads/                       # 文件上传目录
└── docs/                         # 文档文件
```

## 🎮 使用指南

### 基本工作流程
1. **选择工具**: 在主界面选择需要的标注工具
2. **上传图片**: 选择单张图片或整个文件夹
3. **设置输出**: 指定保存路径
4. **开始标注**: 添加标签和描述
5. **保存结果**: 自动保存图片和标签文件

### 文件命名规则
- **Flux工具**: 1.png, 2.png, 3.png... (全局连续编号)
- **Kontext工具**: 1_R.jpg, 1_T.jpg, 1.txt... (按对编号)
- **Tag工具**: 1.jpg, 1.txt, 2.jpg, 2.txt... (按张编号)

### 高级功能
- **固定标签**: 勾选后标签在切换图片时保持不变
- **撤回操作**: 支持撤回最后的保存操作
- **批量处理**: 支持文件夹级别的批量操作
- **实时预览**: 图像拼接和处理的实时预览

## 🛠️ 开发说明

### 开发环境
```bash
# 开发模式 (热重载)
npm run dev

# 后端开发
npm run server

# 同时启动前后端
npm run start
```

### 构建部署
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### API接口
- `POST /api/upload-single` - 单文件上传
- `POST /api/upload-multiple` - 多文件上传
- `POST /api/merge-images` - 图像拼接
- `POST /api/save-label` - 保存标签
- `POST /api/save-image` - 保存图片
- `DELETE /api/delete-file/:filename` - 删除文件

## 📚 文档

- [功能完整说明](./COMPLETE-FEATURES.md)
- [界面美化文档](./COMPLETE-BEAUTIFICATION.md)
- [问题修复记录](./FLUX-FIXES.md)
- [全局计数器功能](./GLOBAL-COUNTER-FEATURE.md)

## 🎊 特色亮点

### 现代化设计
- 🎨 毛玻璃效果和渐变背景
- ✨ 流畅的动画和过渡效果
- 📱 完整的响应式设计
- 🎯 直观的用户界面

### 强大功能
- 🔢 全局计数器保持编号连续
- 🖼️ 真实的图像拼接处理
- 📝 智能的文件命名系统
- 🔄 完整的撤回恢复机制

### 优秀体验
- ⚡ 快速的图片处理速度
- 🎮 键盘快捷键支持
- 📊 详细的进度显示
- 🔔 实时的操作反馈

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**现代化图像标注工具集** - 让图像标注工作更高效、更专业！🚀
