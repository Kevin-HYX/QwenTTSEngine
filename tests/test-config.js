// 测试配置
export const TEST_CONFIG = {
    // 测试API密钥 - 使用前请设置环境变量 QWEN_TTS_API_KEY
    API_KEY: process.env.QWEN_TTS_API_KEY || '',
    
    // API端点
    API_ENDPOINT: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    
    // 测试音色 - 根据技术文档
    TEST_VOICES: ['Chelsie', 'Ethan', 'Serena', 'Cherry', 'Dylan', 'Jada', 'Sunny'],
    
    // 测试文本
    TEST_TEXTS: {
        short: '你好，这是一个测试。',
        medium: '人工智能正在改变我们的生活方式，从智能家居到自动驾驶，AI技术无处不在。',
        long: '在这个数字化时代，人工智能技术正在各个领域发挥着越来越重要的作用。从医疗诊断到金融风控，从智能制造到个性化推荐，AI不仅提高了工作效率，还为人类创造了前所未有的价值。未来，随着技术的不断进步，人工智能将在更多领域实现突破，为人类社会带来更加美好的前景。',
        chinese: '今天天气真好，我们一起去公园散步吧。',
        english: 'Hello, this is a test of the Qwen TTS system.',
        mixed: 'AI技术真的很amazing，未来发展potential巨大！'
    },
    
    // 测试参数
    TIMEOUT: 30000, // 30秒超时
    MAX_RETRIES: 3,
    
    // 期望的响应格式
    EXPECTED_RESPONSE_KEYS: ['output', 'audio', 'usage'],
    
    // 测试用例分组
    TEST_GROUPS: {
        connectivity: '连接性测试',
        authentication: '认证测试',
        text_processing: '文本处理测试',
        voice_selection: '音色选择测试',
        error_handling: '错误处理测试',
        performance: '性能测试'
    }
};

// 测试断言工具
export class TestAsserts {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`断言失败: ${message}\n实际值: ${actual}\n期望值: ${expected}`);
        }
    }
    
    static notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(`断言失败: ${message}\n实际值: ${actual} 不应等于期望值: ${expected}`);
        }
    }
    
    static isTrue(value, message = '') {
        if (!value) {
            throw new Error(`断言失败: ${message}\n期望为真，实际为假`);
        }
    }
    
    static isFalse(value, message = '') {
        if (value) {
            throw new Error(`断言失败: ${message}\n期望为假，实际为真`);
        }
    }
    
    static notNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(`断言失败: ${message}\n值不应为null或undefined`);
        }
    }
    
    static isArray(value, message = '') {
        if (!Array.isArray(value)) {
            throw new Error(`断言失败: ${message}\n期望为数组`);
        }
    }
    
    static contains(array, value, message = '') {
        if (!array.includes(value)) {
            throw new Error(`断言失败: ${message}\n数组 ${JSON.stringify(array)} 不包含 ${value}`);
        }
    }
}

// 测试运行器工具
export class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
    }
    
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }
    
    async run() {
        console.log('🧪 开始运行测试...\n');
        
        for (const test of this.tests) {
            this.results.total++;
            try {
                await test.testFunction();
                console.log(`✅ ${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.error(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
                this.results.errors.push({ test: test.name, error: error.message });
            }
        }
        
        this.printResults();
        return this.results;
    }
    
    printResults() {
        console.log('\n📊 测试结果:');
        console.log(`总测试数: ${this.results.total}`);
        console.log(`通过: ${this.results.passed}`);
        console.log(`失败: ${this.results.failed}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ 失败详情:');
            this.results.errors.forEach(error => {
                console.log(`  ${error.test}: ${error.error}`);
            });
        }
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`\n🎯 成功率: ${successRate}%`);
    }
}

// 延迟工具
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 日志工具
export const logger = {
    info: (message) => console.log(`ℹ️  ${message}`),
    success: (message) => console.log(`✅ ${message}`),
    error: (message) => console.error(`❌ ${message}`),
    warn: (message) => console.warn(`⚠️  ${message}`)
};