import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3000;

// 启用CORS
app.use(cors());

// 静态文件服务
app.use(express.static('.'));

// 代理API请求 - 代理到完整的API端点
app.use('/api/v1/services/aigc/multimodal-generation/generation', createProxyMiddleware({
    target: 'https://dashscope.aliyuncs.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1/services/aigc/multimodal-generation/generation': '/api/v1/services/aigc/multimodal-generation/generation'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`代理请求: ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`代理响应: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('代理错误:', err.message);
        res.status(500).json({ error: '代理服务器错误', message: err.message });
    }
}));

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '本地代理服务器运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 本地服务器已启动`);
    console.log(`📁 访问: http://localhost:${PORT}`);
    console.log(`🎯 API代理: http://localhost:${PORT}/api/v1/services/aigc/multimodal-generation/generation`);
    console.log(`💡 现在可以通过 http://localhost:${PORT}/index.html 访问应用`);
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理拒绝:', reason);
});