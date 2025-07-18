import { QwenTTSAPITests } from './tests/api-tests.js';

// 使用提供的API密钥运行测试
const apiKey = 'sk-71ff6f55ecb549ecb209a6b282fd382e';
const tests = new QwenTTSAPITests(apiKey);

tests.runAllTests().then(results => {
    console.log('测试完成');
    if (results.failed > 0) {
        process.exit(1);
    }
}).catch(console.error);