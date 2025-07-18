// 快速测试API - 使用给定密钥
const API_KEY = 'sk-71ff6f55ecb549ecb209a6b282fd382e';
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

async function testAPI() {
    console.log('🔍 开始API测试...');
    
    const testCases = [
        { text: '你好，这是一个测试。', voice: 'Chelsie', name: '基础测试' },
        { text: 'Hello, this is a test.', voice: 'Ethan', name: '英文测试' },
        { text: '今天天气真好', voice: 'Serena', name: '中文测试' }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`\n📋 正在测试: ${testCase.name}`);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-SSE': 'enable'
                },
                body: JSON.stringify({
                    model: 'qwen-tts',
                    input: {
                        text: testCase.text,
                        voice: testCase.voice
                    }
                })
            });
            
            console.log(`📡 响应状态: ${response.status}`);
            
            if (!response.ok) {
                console.error(`❌ HTTP错误: ${response.status} ${response.statusText}`);
                continue;
            }
            
            const text = await response.text();
            console.log('📄 原始响应:', text.slice(0, 300));
            
            // 解析SSE格式 - 查找data:开头的行
            const lines = text.split('\n');
            let data = null;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                    try {
                        const jsonStr = trimmed.slice(5).trim();
                        const parsed = JSON.parse(jsonStr);
                        
                        // 检查是结果还是错误
                        if (parsed.output?.audio || parsed.output?.finish_reason) {
                            data = parsed;
                            break;
                        }
                        if (parsed.error) {
                            console.error(`❌ API错误: ${parsed.error.message}`);
                            break;
                        }
                    } catch (e) {
                        console.warn('⚠️  解析失败:', trimmed);
                    }
                }
            }
            
            if (!data) {
                console.error('❌ 未找到有效数据');
                continue;
            }
            
            // 检查响应格式
            if (data.error) {
                console.error(`❌ API错误: ${data.error.message}`);
                continue;
            }
            
            if (data.output?.audio) {
                const audioData = data.output.audio;
                if (audioData.url) {
                    console.log(`✅ 成功获得音频URL: ${audioData.url.slice(0, 50)}...`);
                } else if (audioData.data) {
                    console.log(`✅ 成功获得音频数据，长度: ${audioData.data.length}`);
                }
                
                if (data.usage) {
                    console.log(`📈 Token使用: 输入${data.usage.input_tokens}, 输出${data.usage.output_tokens}`);
                }
            } else {
                console.error('❌ 未找到音频数据');
            }
            
        } catch (error) {
            console.error(`❌ 测试失败: ${error.message}`);
        }
    }
    
    console.log('\n🎯 测试完成');
}

testAPI().catch(console.error);