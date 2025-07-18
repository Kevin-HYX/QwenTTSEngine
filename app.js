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

        // 关闭模态框
        document.querySelectorAll('.modal').forEach(modal => {
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

    showApiKeyModal() {
        document.getElementById('apiKeyModal').classList.add('show');
        setTimeout(() => document.getElementById('apiKeyInput').focus(), 100);
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            alert('请输入有效的API密钥');
            return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('qwen_tts_api_key', apiKey);
        this.closeModal('apiKeyModal');
        this.showMainApp();
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
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify({
                model: 'qwen-tts',
                input: {
                    text: text,
                    voice: voice
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'API调用失败');
        }

        // 处理Base64音频数据
        const audioBase64 = data.output?.audio || data.audio;
        if (!audioBase64) {
            throw new Error('未收到音频数据');
        }

        // 将Base64转换为Blob
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return new Blob([bytes], { type: 'audio/wav' });
    }

    playAudio(audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioPlayer = document.getElementById('audioPlayer');
        const audioContainer = document.querySelector('.audio-player-container');
        
        audioPlayer.src = audioUrl;
        audioContainer.classList.add('has-audio');
        
        // 存储当前音频数据用于保存
        this.currentAudio = {
            blob: audioBlob,
            url: audioUrl,
            filename: `qwen-tts-${Date.now()}.wav`
        };

        // 自动播放
        audioPlayer.play().catch(e => console.log('自动播放被阻止:', e));
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