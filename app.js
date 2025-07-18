class QwenTTSEngine {
    constructor() {
        this.apiKey = localStorage.getItem('qwen_tts_api_key');
        this.currentAudio = null;
        this.hasUnsavedAudio = false;
        this.dontAskAgain = localStorage.getItem('dont_ask_again') === 'true';
        this.currentTheme = localStorage.getItem('theme_color') || '#007bff';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyTheme(this.currentTheme);
        
        if (!this.apiKey) {
            this.showApiKeyModal();
        } else {
            this.showMainApp();
        }
    }

    bindEvents() {
        // API密钥相关
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        document.getElementById('closeApiKeyModal').addEventListener('click', () => this.closeApiKeyModal());

        // 文本输入相关
        const textInput = document.getElementById('textInput');
        textInput.addEventListener('input', (e) => this.handleTextInput(e));
        textInput.addEventListener('paste', (e) => this.handleTextInput(e));

        // 音色选择
        document.getElementById('voiceSelect').addEventListener('change', (e) => this.handleVoiceSelect(e));

        // 生成按钮
        document.getElementById('generateBtn').addEventListener('click', () => this.handleGenerate());
        document.querySelector('.dropdown-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // 下拉菜单
        document.getElementById('saveAudioBtn').addEventListener('click', () => this.saveAudio());

        // 设置相关
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeModal('settingsModal'));
        document.getElementById('themeColor').addEventListener('change', (e) => this.updateTheme(e.target.value));
        document.getElementById('apiKeyReset').addEventListener('click', () => this.resetApiKey());

        // 保存确认
        document.getElementById('confirmSave').addEventListener('click', () => this.confirmSave(true));
        document.getElementById('confirmDiscard').addEventListener('click', () => this.confirmSave(false));

        // 点击空白处关闭下拉菜单
        document.addEventListener('click', () => this.hideDropdown());

        // 关闭模态框 - 排除API密钥模态框
        document.querySelectorAll('.modal:not(#apiKeyModal)').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    showApiKeyModal(isInitial = true) {
        const modal = document.getElementById('apiKeyModal');
        const closeButton = document.getElementById('closeApiKeyModal');
        const message = document.getElementById('apiKeyMessage');
        
        modal.classList.add('show');
        
        if (isInitial) {
            // 首次设置，隐藏关闭按钮并修改提示信息
            closeButton.style.display = 'none';
            message.textContent = '首次使用需要输入阿里云百炼平台的API密钥';
        } else {
            // 后续设置，显示关闭按钮
            closeButton.style.display = 'inline-block';
            message.textContent = '请重新输入阿里云百炼平台的API密钥';
        }
        
        setTimeout(() => document.getElementById('apiKeyInput').focus(), 100);
    }

    closeApiKeyModal() {
        this.closeModal('apiKeyModal');
        // 清除输入框
        document.getElementById('apiKeyInput').value = '';
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            this.showValidationError('请输入有效的API密钥');
            return;
        }

        // 显示验证状态
        this.showValidationState('正在验证API密钥...');

        try {
            const isValid = await this.validateApiKey(apiKey);
            
            if (isValid) {
                // API密钥有效
                this.apiKey = apiKey;
                localStorage.setItem('qwen_tts_api_key', apiKey);
                this.showValidationSuccess('API密钥验证成功！');
                
                setTimeout(() => {
                    this.closeModal('apiKeyModal');
                    this.showMainApp();
                }, 1000);
            } else {
                // API密钥无效
                this.showValidationError('API密钥无效，请重新输入');
            }
        } catch (error) {
            this.showValidationError('验证失败：' + error.message);
        }
    }

    async validateApiKey(apiKey) {
        // 发送一个简单的验证请求到API
        try {
            const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen-tts-latest',
                    input: {
                        text: "测试",
                        voice: "Chelsie"
                    },
                    stream: false
                })
            });

            // 如果返回401或403，表示API密钥无效
            if (response.status === 401 || response.status === 403) {
                return false;
            }

            // 其他状态码（包括200）都认为密钥是有效的
            // 因为即使是配额用尽，密钥本身也是有效的
            return true;
        } catch (error) {
            // 网络错误也返回true，避免频繁验证
            console.warn('网络验证失败，但允许继续：', error);
            return true;
        }
    }

    showValidationState(message) {
        const saveBtn = document.getElementById('saveApiKey');
        const originalText = saveBtn.innerHTML;
        
        saveBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
            ${message}
        `;
        saveBtn.disabled = true;
        
        // 添加验证状态样式
        const modalContent = document.querySelector('#apiKeyModal .modal-content');
        this.removeValidationMessages();
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'validation-status';
        statusDiv.innerHTML = message;
        statusDiv.style.cssText = `
            background: var(--info-light);
            color: var(--info-color);
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid var(--info-color);
            text-align: center;
            font-size: 14px;
        `;
        modalContent.appendChild(statusDiv);
    }

    showValidationSuccess(message) {
        const saveBtn = document.getElementById('saveApiKey');
        const modalContent = document.querySelector('#apiKeyModal .modal-content');
        
        this.removeValidationMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'validation-success';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            ${message}
        `;
        successDiv.style.cssText = `
            background: var(--success-light);
            color: var(--success-color);
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid var(--success-color);
            text-align: center;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
        `;
        modalContent.appendChild(successDiv);
        
        // 更新按钮状态
        saveBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>验证成功';
        saveBtn.style.background = 'var(--success-color)';
    }

    showValidationError(message) {
        const saveBtn = document.getElementById('saveApiKey');
        const modalContent = document.querySelector('#apiKeyModal .modal-content');
        
        this.removeValidationMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
            ${message}
        `;
        errorDiv.style.cssText = `
            background: var(--danger-light);
            color: var(--danger-color);
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid var(--danger-color);
            text-align: center;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
        `;
        modalContent.appendChild(errorDiv);
        
        // 恢复按钮状态
        saveBtn.innerHTML = '重新输入';
        saveBtn.disabled = false;
    }

    removeValidationMessages() {
        const modalContent = document.querySelector('#apiKeyModal .modal-content');
        const messages = modalContent.querySelectorAll('.validation-status, .validation-success, .validation-error');
        messages.forEach(msg => msg.remove());
        
        // 恢复按钮原始状态
        const saveBtn = document.getElementById('saveApiKey');
        saveBtn.innerHTML = '保存';
        saveBtn.disabled = false;
        saveBtn.style.background = '';
    }

    resetApiKey() {
        localStorage.removeItem('qwen_tts_api_key');
        this.apiKey = null;
        this.closeModal('settingsModal');
        this.showApiKeyModal();
    }

    showMainApp() {
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('mainApp').classList.add('fade-in');
    }

    handleTextInput(e) {
        const text = e.target.value;
        const charCount = text.length;
        const charCounter = document.getElementById('charCount');
        
        charCounter.textContent = charCount;
        
        if (charCount > 512) {
            charCounter.parentElement.classList.add('error');
            document.getElementById('generateBtn').disabled = true;
        } else {
            charCounter.parentElement.classList.remove('error');
            document.getElementById('generateBtn').disabled = charCount === 0 || !document.getElementById('voiceSelect').value;
        }
    }

    handleVoiceSelect(e) {
        const text = document.getElementById('textInput').value;
        document.getElementById('generateBtn').disabled = !e.target.value || text.length === 0 || text.length > 512;
    }

    toggleDropdown() {
        const dropdown = document.getElementById('generateDropdown');
        const isVisible = dropdown.style.display === 'block';
        
        if (isVisible) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    }

    showDropdown() {
        document.getElementById('generateDropdown').style.display = 'block';
        document.getElementById('generateBtn').classList.add('active');
    }

    hideDropdown() {
        document.getElementById('generateDropdown').style.display = 'none';
        document.getElementById('generateBtn').classList.remove('active');
    }

    async handleGenerate() {
        if (this.hasUnsavedAudio && !this.dontAskAgain) {
            this.showSaveConfirmModal();
            return;
        }

        await this.generateAudio();
    }

    showSaveConfirmModal() {
        document.getElementById('saveConfirmModal').classList.add('show');
    }

    confirmSave(shouldSave) {
        if (shouldSave) {
            this.saveAudio(false);
        }

        const dontAsk = document.getElementById('dontAskAgain').checked;
        if (dontAsk) {
            this.dontAskAgain = true;
            localStorage.setItem('dont_ask_again', 'true');
        }

        this.closeModal('saveConfirmModal');
        this.generateAudio();
    }

    async generateAudio() {
        const text = document.getElementById('textInput').value.trim();
        const voice = document.getElementById('voiceSelect').value;

        if (!text || !voice) {
            alert('请输入文本并选择音色');
            return;
        }

        if (text.length > 512) {
            alert('文本长度不能超过512个字符');
            return;
        }

        this.showLoading(true);

        try {
            const audioBlob = await this.callTTSAPI(text, voice);
            this.playAudio(audioBlob);
            this.hasUnsavedAudio = true;
        } catch (error) {
            console.error('生成音频失败:', error);
            alert('生成音频失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async callTTSAPI(text, voice) {
        try {
            const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen-tts-latest',
                    input: {
                        text: text,
                        voice: voice
                    },
                    stream: false
                })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // API密钥无效或权限问题
                    this.handleInvalidApiKey();
                    throw new Error('API密钥无效或已过期，请重新设置');
                } else if (response.status === 429) {
                    throw new Error('请求过于频繁，请稍后再试');
                } else if (response.status === 500) {
                    throw new Error('服务器内部错误，请稍后再试');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const data = await response.json();
            
            if (data.error) {
                // 处理API返回的错误
                if (data.error.code === 'InvalidApiKey' || data.error.code === 'AuthenticationError') {
                    this.handleInvalidApiKey();
                    throw new Error('API密钥无效，请重新设置');
                }
                throw new Error(data.error.message || 'API调用失败');
            }

            // 验证API响应结构
            if (!data.output || !data.output.audio) {
                throw new Error('API响应格式错误');
            }

            // 根据技术文档解析响应格式
            const audioData = data.output.audio;
            
            // 非流式输出返回音频URL
            if (audioData.url) {
                // 获取音频文件
                const audioResponse = await fetch(audioData.url);
                if (!audioResponse.ok) {
                    throw new Error('无法获取音频文件');
                }
                return await audioResponse.blob();
            } else if (audioData.data) {
                // 处理Base64音频数据
                const audioBase64 = audioData.data;
                const binaryString = atob(audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return new Blob([bytes], { type: 'audio/wav' });
            } else {
                throw new Error('音频数据格式不正确');
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络连接');
            }
            throw error;
        }
    }

    playAudio(audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioPlayer = document.getElementById('audioPlayer');
        const audioContainer = document.querySelector('.audio-player-container');
        
        // Use browser's default audio player
        audioPlayer.src = audioUrl;
        
        // Store audio data for saving
        this.currentAudio = {
            blob: audioBlob,
            url: audioUrl,
            filename: `qwen-tts-${Date.now()}.wav`
        };
    }


    saveAudio(showAlert = true) {
        if (!this.currentAudio) {
            if (showAlert) alert('没有可保存的音频');
            return;
        }

        const a = document.createElement('a');
        a.href = this.currentAudio.url;
        a.download = this.currentAudio.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        this.hasUnsavedAudio = false;
        if (showAlert) alert('音频已保存');
    }

    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    handleInvalidApiKey() {
        // 清除无效的API密钥
        localStorage.removeItem('qwen_tts_api_key');
        this.apiKey = null;
        
        // 显示API密钥输入框
        setTimeout(() => {
            this.showApiKeyModal();
            
            // 在API密钥输入框中添加提示信息
            const apiKeyInput = document.getElementById('apiKeyInput');
            if (apiKeyInput) {
                const modalContent = document.querySelector('#apiKeyModal .modal-content');
                if (modalContent) {
                    // 移除之前的错误提示
                    const existingError = modalContent.querySelector('.error-message');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    // 添加错误提示
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.style.cssText = `
                        background: var(--danger-light);
                        color: var(--danger-color);
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid var(--danger-color);
                        font-size: 14px;
                    `;
                    errorDiv.innerHTML = `
                        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                        API密钥无效或已过期，请重新输入有效的API密钥
                    `;
                    
                    modalContent.insertBefore(errorDiv, modalContent.firstChild);
                    apiKeyInput.focus();
                }
            }
        }, 100);
    }

    updateTheme(color) {
        this.currentTheme = color;
        localStorage.setItem('theme_color', color);
        this.applyTheme(color);
    }

    applyTheme(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        document.getElementById('themeColor').value = color;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // 工具方法
    formatTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new QwenTTSEngine();
});

// 处理页面卸载
document.addEventListener('beforeunload', (e) => {
    const app = window.qwenTTSApp;
    if (app && app.hasUnsavedAudio && !app.dontAskAgain) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});