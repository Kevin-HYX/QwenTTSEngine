import { TEST_CONFIG, TestAsserts, TestRunner, logger } from './test-config.js';

class QwenTTSAPITests {
    constructor(apiKey = null) {
        this.baseURL = TEST_CONFIG.API_ENDPOINT;
        this.apiKey = apiKey || TEST_CONFIG.API_KEY;
        this.runner = new TestRunner();
    }

    async runAllTests() {
        console.log('🔍 开始API通信测试...\n');
        
        this.setupTests();
        const results = await this.runner.run();
        
        return results;
    }

    setupTests() {
        // 连接性测试
        this.runner.addTest('基础连接测试', () => this.testBasicConnectivity());
        this.runner.addTest('API密钥验证测试', () => this.testApiKeyValidation());
        
        // 文本处理测试
        this.runner.addTest('短文本处理测试', () => this.testShortText());
        this.runner.addTest('中等文本处理测试', () => this.testMediumText());
        this.runner.addTest('长文本处理测试', () => this.testLongText());
        this.runner.addTest('中文文本测试', () => this.testChineseText());
        this.runner.addTest('英文文本测试', () => this.testEnglishText());
        this.runner.addTest('中英混合文本测试', () => this.testMixedText());
        
        // 音色选择测试
        this.runner.addTest('标准女声测试', () => this.testFemaleVoice());
        this.runner.addTest('标准男声测试', () => this.testMaleVoice());
        this.runner.addTest('方言音色测试', () => this.testDialectVoice());
        
        // 边界条件测试
        this.runner.addTest('空文本测试', () => this.testEmptyText());
        this.runner.addTest('超长文本测试', () => this.testExceedMaxLength());
        this.runner.addTest('特殊字符测试', () => this.testSpecialCharacters());
        
        // 错误处理测试
        this.runner.addTest('无效API密钥测试', () => this.testInvalidApiKey());
        this.runner.addTest('无效音色测试', () => this.testInvalidVoice());
    }

    async testBasicConnectivity() {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen-tts',
                    input: {
                        text: '测试',
                        voice: 'Chelsie'
                    }
                })
            });

            TestAsserts.notNull(response, '应该收到响应');
            TestAsserts.isTrue(response.ok || response.status === 400, '应该收到有效响应');
            logger.success('基础连接测试通过');
        } catch (error) {
            throw new Error(`连接失败: ${error.message}`);
        }
    }

    async testApiKeyValidation() {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen-tts',
                    input: {
                        text: '验证密钥',
                        voice: 'Chelsie'
                    }
                })
            });

            // 检查是否返回401未授权错误
            if (response.status === 401) {
                throw new Error('API密钥无效或已过期');
            }

            TestAsserts.notEqual(response.status, 401, '不应返回401未授权');
            logger.success('API密钥验证测试通过');
        } catch (error) {
            throw new Error(`密钥验证失败: ${error.message}`);
        }
    }

    async testShortText() {
        const text = TEST_CONFIG.TEST_TEXTS.short;
        const result = await this.callTTSAPI(text, 'Chelsie');
        this.validateTTSResponse(result);
        logger.success('短文本处理测试通过');
    }

    async testMediumText() {
        const text = TEST_CONFIG.TEST_TEXTS.medium;
        const result = await this.callTTSAPI(text, 'Ethan');
        this.validateTTSResponse(result);
        logger.success('中等文本处理测试通过');
    }

    async testLongText() {
        const text = TEST_CONFIG.TEST_TEXTS.long;
        const result = await this.callTTSAPI(text, 'Serena');
        this.validateTTSResponse(result);
        logger.success('长文本处理测试通过');
    }

    async testChineseText() {
        const text = TEST_CONFIG.TEST_TEXTS.chinese;
        const result = await this.callTTSAPI(text, 'Dylan');
        this.validateTTSResponse(result);
        logger.success('中文文本测试通过');
    }

    async testEnglishText() {
        const text = TEST_CONFIG.TEST_TEXTS.english;
        const result = await this.callTTSAPI(text, 'Cherry');
        this.validateTTSResponse(result);
        logger.success('英文文本测试通过');
    }

    async testMixedText() {
        const text = TEST_CONFIG.TEST_TEXTS.mixed;
        const result = await this.callTTSAPI(text, 'Jada');
        this.validateTTSResponse(result);
        logger.success('中英混合文本测试通过');
    }

    async testFemaleVoice() {
        const text = '女声测试';
        const result = await this.callTTSAPI(text, 'Chelsie');
        this.validateTTSResponse(result);
        logger.success('标准女声测试通过');
    }

    async testMaleVoice() {
        const text = '男声测试';
        const result = await this.callTTSAPI(text, 'Ethan');
        this.validateTTSResponse(result);
        logger.success('标准男声测试通过');
    }

    async testDialectVoice() {
        const text = '方言测试';
        const result = await this.callTTSAPI(text, 'Dylan');
        this.validateTTSResponse(result);
        logger.success('方言音色测试通过');
    }

    async testEmptyText() {
        try {
            await this.callTTSAPI('', 'Chelsie');
            throw new Error('应该抛出空文本错误');
        } catch (error) {
            if (error.message.includes('429')) {
                console.warn('⚠️  跳过空文本测试：API频率限制');
                return;
            }
            TestAsserts.contains(error.message, 'text', '应该提示文本问题');
            logger.success('空文本测试通过');
        }
    }

    async testExceedMaxLength() {
        const text = '测'.repeat(513);
        try {
            await this.callTTSAPI(text, 'Chelsie');
            throw new Error('应该抛出超长文本错误');
        } catch (error) {
            if (error.message.includes('429')) {
                console.warn('⚠️  跳过超长文本测试：API频率限制');
                return;
            }
            TestAsserts.isTrue(error.message.includes('512') || error.message.includes('max'), '应该提示长度限制');
            logger.success('超长文本测试通过');
        }
    }

    async testSpecialCharacters() {
        const text = '测试！＠＃＄％＾＆＊（）＿＋｛｝［］｜＼：；＂＇＜＞？，．／';
        const result = await this.callTTSAPI(text, 'Chelsie');
        this.validateTTSResponse(result);
        logger.success('特殊字符测试通过');
    }

    async testInvalidApiKey() {
        try {
            await this.callTTSAPIWithKey('测试', 'Chelsie', 'invalid-key');
            throw new Error('应该抛出无效密钥错误');
        } catch (error) {
            TestAsserts.isTrue(error.message.includes('401') || error.message.includes('unauthorized'), '应该提示认证错误');
            logger.success('无效API密钥测试通过');
        }
    }

    async testInvalidVoice() {
        try {
            await this.callTTSAPI('测试', 'InvalidVoice');
            throw new Error('应该抛出无效音色错误');
        } catch (error) {
            TestAsserts.isTrue(error.message.includes('voice') || error.message.includes('invalid'), '应该提示音色错误');
            logger.success('无效音色测试通过');
        }
    }

    async callTTSAPI(text, voice) {
        return this.callTTSAPIWithKey(text, voice, this.apiKey);
    }

    async callTTSAPIWithKey(text, voice, apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.TIMEOUT);

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-SSE': 'enable'
                },
                body: JSON.stringify({
                    model: 'qwen-tts',
                    input: {
                        text: text,
                        voice: voice
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('请求频率限制，请稍后再试');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 处理SSE流式响应
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            let finalData = null;
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.output?.audio) {
                            finalData = data;
                            break;
                        }
                        if (data.error) {
                            throw new Error(data.error.message || 'API返回错误');
                        }
                    } catch (e) {
                        // 忽略解析错误的行
                    }
                }
            }

            if (!finalData) {
                // 尝试直接解析为JSON
                try {
                    finalData = JSON.parse(text);
                } catch (e) {
                    throw new Error('无法解析API响应格式');
                }
            }

            return finalData;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            throw error;
        }
    }

    validateTTSResponse(data) {
        TestAsserts.notNull(data, '响应数据不应为null');
        
        // 检查基本结构
        if (data.error) {
            throw new Error(`API错误: ${data.error.message || data.error}`);
        }

        // 根据技术文档检查响应结构
        const audioData = data.output?.audio;
        TestAsserts.notNull(audioData, '应该包含音频数据');

        // 检查是否包含URL或数据
        if (audioData.url) {
            TestAsserts.isTrue(typeof audioData.url === 'string', '音频URL应为字符串');
            TestAsserts.notNull(audioData.expires_at, '应该包含过期时间');
            TestAsserts.notNull(audioData.id, '应该包含音频ID');
            logger.success(`响应验证通过，音频URL: ${audioData.url.slice(0, 50)}...`);
        } else if (audioData.data) {
            TestAsserts.isTrue(typeof audioData.data === 'string', '音频数据应为Base64字符串');
            TestAsserts.isTrue(audioData.data.length > 1000, '音频数据长度应合理');
            logger.success(`响应验证通过，音频数据长度: ${audioData.data.length} 字符`);
        } else {
            throw new Error('音频数据格式不正确');
        }

        // 检查使用情况
        if (data.usage) {
            TestAsserts.notNull(data.usage.input_tokens, '应该包含输入token信息');
            TestAsserts.notNull(data.usage.output_tokens, '应该包含输出token信息');
            TestAsserts.notNull(data.usage.total_tokens, '应该包含总token信息');
        }
    }
}

// 运行测试的入口函数
async function runAPITests() {
    const tests = new QwenTTSAPITests();
    const results = await tests.runAllTests();
    
    if (results.failed > 0) {
        console.error('\n❌ 部分测试失败，需要修复');
        process.exit(1);
    } else {
        console.log('\n🎉 所有API测试通过！');
        return results;
    }
}

// 如果是直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    runAPITests().catch(console.error);
}

export { QwenTTSAPITests, runAPITests };