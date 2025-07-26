const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5176';

// 中间件配置
app.use(cors({
    origin: [
        CORS_ORIGIN,
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5174',
        'http://192.168.1.101:5174',
        'http://198.18.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
        files: 100 // 最多100个文件
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// API路由

// 上传单个文件
app.post('/api/upload-single', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        res.json({
            success: true,
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 上传多个文件 - 使用更宽松的配置
const uploadMultiple = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            // 不拒绝，而是跳过无效文件
            return cb(null, false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
        files: 100 // 最多100个文件
    }
});

app.post('/api/upload-multiple', (req, res) => {
    uploadMultiple.any()(req, res, (err) => {
        try {
            if (err) {
                console.error('上传错误:', err);
                return res.status(500).json({ error: err.message });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: '没有找到有效的图片文件' });
            }

            const files = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                path: `/uploads/${file.filename}`
            }));

            res.json({
                success: true,
                files: files
            });
        } catch (error) {
            console.error('多文件上传错误:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// 图像拼接API - 使用Sharp进行真正的图像拼接
app.post('/api/merge-images', async (req, res) => {
    try {
        const { leftImage, rightImage, outputPath, customName } = req.body;

        if (!leftImage || !rightImage) {
            return res.status(400).json({ error: '缺少图像文件' });
        }

        const leftPath = path.join(uploadDir, leftImage);
        const rightPath = path.join(uploadDir, rightImage);

        // 检查文件是否存在
        if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) {
            return res.status(404).json({ error: '图像文件不存在' });
        }

        // 使用sharp进行图像拼接
        const leftImg = sharp(leftPath);
        const rightImg = sharp(rightPath);

        const leftMeta = await leftImg.metadata();
        const rightMeta = await rightImg.metadata();

        // 检查图像尺寸是否一致
        if (leftMeta.height !== rightMeta.height) {
            return res.status(400).json({ error: '图像高度不一致，无法拼接' });
        }

        const mergedWidth = leftMeta.width + rightMeta.width;
        const mergedHeight = leftMeta.height;

        // 创建合并后的图像文件名
        const mergedFilename = customName ? `${customName}.png` : `merged-${Date.now()}.png`;

        // 确定保存路径
        let saveDir = uploadDir;
        if (outputPath && outputPath.trim()) {
            saveDir = outputPath;
            // 确保输出目录存在
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
        }

        // 对于预览，总是保存到uploads目录；对于正式保存，保存到指定路径
        let finalPath;
        if (!outputPath || outputPath.trim() === '') {
            // 预览模式：保存到uploads目录
            finalPath = path.join(uploadDir, mergedFilename);
        } else {
            // 正式保存模式：保存到指定路径
            finalPath = path.join(saveDir, mergedFilename);
        }

        await sharp({
            create: {
                width: mergedWidth,
                height: mergedHeight,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
        .composite([
            { input: leftPath, left: 0, top: 0 },
            { input: rightPath, left: leftMeta.width, top: 0 }
        ])
        .png()
        .toFile(finalPath);

        // 对于预览，还需要复制一份到uploads目录以便前端访问
        if (outputPath && outputPath.trim() !== '') {
            const previewPath = path.join(uploadDir, mergedFilename);
            await sharp(finalPath).png().toFile(previewPath);
        }

        res.json({
            success: true,
            mergedImage: mergedFilename,
            path: `/uploads/${mergedFilename}`,
            savedPath: finalPath
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 保存标签文件
app.post('/api/save-label', (req, res) => {
    try {
        const { filename, label, outputPath } = req.body;

        if (!filename || !label) {
            return res.status(400).json({ error: '缺少文件名或标签内容' });
        }

        const labelFilename = filename.includes('.') ? filename.replace(/\.[^/.]+$/, '.txt') : filename + '.txt';

        // 如果指定了输出路径，使用输出路径，否则使用默认上传目录
        let labelPath;
        if (outputPath && outputPath.trim()) {
            // 确保输出目录存在
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
            labelPath = path.join(outputPath, labelFilename);
        } else {
            labelPath = path.join(uploadDir, labelFilename);
        }

        fs.writeFileSync(labelPath, label, 'utf8');

        console.log('保存标签文件:', labelPath);

        res.json({
            success: true,
            labelFile: labelFilename,
            savedPath: labelPath
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除文件
app.delete('/api/delete-file/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: '文件删除成功' });
        } else {
            res.status(404).json({ error: '文件不存在' });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 保存单张图片到指定路径
app.post('/api/save-image', (req, res) => {
    try {
        const { sourceFilename, newFilename, outputPath } = req.body;

        if (!sourceFilename || !newFilename) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        const sourcePath = path.join(uploadDir, sourceFilename);

        // 检查源文件是否存在
        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: '源文件不存在' });
        }

        // 确定保存路径
        let saveDir = uploadDir;
        if (outputPath && outputPath.trim()) {
            saveDir = outputPath;
            // 确保输出目录存在
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
        }

        // 保持原文件扩展名
        const sourceExt = path.extname(sourceFilename);
        const finalFilename = newFilename.includes('.') ? newFilename : `${newFilename}${sourceExt}`;
        const targetPath = path.join(saveDir, finalFilename);

        // 复制文件
        fs.copyFileSync(sourcePath, targetPath);

        res.json({
            success: true,
            savedFile: finalFilename,
            savedPath: targetPath
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取文件列表
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir)
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .map(file => ({
                filename: file,
                path: `/uploads/${file}`,
                stats: fs.statSync(path.join(uploadDir, file))
            }));

        res.json({ success: true, files });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 复制和重命名文件API (用于KontextTool)
app.post('/api/copy-rename-files', (req, res) => {
    try {
        const { originalFile, targetFile, baseName, outputPath } = req.body;

        if (!originalFile || !targetFile || !baseName) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        const originalPath = path.join(uploadDir, originalFile);
        const targetPath = path.join(uploadDir, targetFile);

        // 检查源文件是否存在
        if (!fs.existsSync(originalPath) || !fs.existsSync(targetPath)) {
            return res.status(404).json({ error: '源文件不存在' });
        }

        // 复制并重命名文件
        const originalExt = path.extname(originalFile);
        const targetExt = path.extname(targetFile);

        const newOriginalName = `${baseName}_R${originalExt}`;
        const newTargetName = `${baseName}_T${targetExt}`;

        // 确定保存路径
        let saveDir = uploadDir;
        if (outputPath && outputPath.trim()) {
            saveDir = outputPath;
            // 确保输出目录存在
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
        }

        const newOriginalPath = path.join(saveDir, newOriginalName);
        const newTargetPath = path.join(saveDir, newTargetName);

        fs.copyFileSync(originalPath, newOriginalPath);
        fs.copyFileSync(targetPath, newTargetPath);

        res.json({
            success: true,
            originalFile: newOriginalName,
            targetFile: newTargetName,
            savedPath: saveDir
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器启动成功!`);
    console.log(`📍 服务器运行在:`);
    console.log(`  ✅ 本地访问: http://localhost:${PORT}`);
    console.log(`  🌐 网络访问: http://192.168.1.101:${PORT}`);
    console.log(`  📋 API文档: http://localhost:${PORT}/api/health`);
    console.log(`  📁 文件服务: http://localhost:${PORT}/uploads`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log(`🔄 进程ID: ${process.pid}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('📴 收到SIGTERM信号，正在优雅关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 收到SIGINT信号，正在优雅关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 错误处理 - 改为记录错误但不立即退出
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    console.error('📍 错误堆栈:', error.stack);
    // 在生产环境中可能需要退出，但开发环境中继续运行
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    console.error('📍 Promise:', promise);
    // 在生产环境中可能需要退出，但开发环境中继续运行
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// 项目管理API
const projectsFile = path.join(__dirname, 'data', 'projects.json');
const clientsFile = path.join(__dirname, 'data', 'clients.json');
const deploymentsFile = path.join(__dirname, 'data', 'deployments.json');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 读取JSON文件的辅助函数
const readJsonFile = (filePath, defaultValue = []) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
};

// 写入JSON文件的辅助函数
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

// 项目管理API端点
app.get('/api/projects', (req, res) => {
    const projects = readJsonFile(projectsFile, []);
    res.json(projects);
});

app.post('/api/projects', (req, res) => {
    const projects = readJsonFile(projectsFile, []);
    const newProject = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    projects.push(newProject);

    if (writeJsonFile(projectsFile, projects)) {
        res.json(newProject);
    } else {
        res.status(500).json({ error: 'Failed to save project' });
    }
});

app.put('/api/projects/:id', (req, res) => {
    const projects = readJsonFile(projectsFile, []);
    const projectIndex = projects.findIndex(p => p.id === req.params.id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    projects[projectIndex] = {
        ...projects[projectIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    if (writeJsonFile(projectsFile, projects)) {
        res.json(projects[projectIndex]);
    } else {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', (req, res) => {
    const projects = readJsonFile(projectsFile, []);
    const filteredProjects = projects.filter(p => p.id !== req.params.id);

    if (writeJsonFile(projectsFile, filteredProjects)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// 甲方管理API端点
app.get('/api/clients', (req, res) => {
    const clients = readJsonFile(clientsFile, []);
    res.json(clients);
});

app.post('/api/clients', (req, res) => {
    const clients = readJsonFile(clientsFile, []);
    const newClient = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    clients.push(newClient);

    if (writeJsonFile(clientsFile, clients)) {
        res.json(newClient);
    } else {
        res.status(500).json({ error: 'Failed to save client' });
    }
});

app.put('/api/clients/:id', (req, res) => {
    const clients = readJsonFile(clientsFile, []);
    const clientIndex = clients.findIndex(c => c.id === req.params.id);

    if (clientIndex === -1) {
        return res.status(404).json({ error: 'Client not found' });
    }

    clients[clientIndex] = {
        ...clients[clientIndex],
        ...req.body
    };

    if (writeJsonFile(clientsFile, clients)) {
        res.json(clients[clientIndex]);
    } else {
        res.status(500).json({ error: 'Failed to update client' });
    }
});

app.delete('/api/clients/:id', (req, res) => {
    const clients = readJsonFile(clientsFile, []);
    const filteredClients = clients.filter(c => c.id !== req.params.id);

    if (writeJsonFile(clientsFile, filteredClients)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});
