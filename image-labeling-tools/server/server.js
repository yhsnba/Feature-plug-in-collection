const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = 3004;

// 中间件
app.use(cors());
app.use(express.json());
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB限制
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

// 上传多个文件
app.post('/api/upload-multiple', upload.array('images', 50), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传文件' });
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
        res.status(500).json({ error: error.message });
    }
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

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});
