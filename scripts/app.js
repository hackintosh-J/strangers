// App Controller
const App = {
    state: {
        messages: [],
        page: 1,
        isLoading: false,
        hasMore: true,
        isSubmitting: false,
        token: null,
    },

    constants: {
        CACHE_KEY: 'strangers_cache_v1',
        REFRESH_KEY: 'strangers_last_refresh',
        TOKEN_KEY: 'strangers_token',
        REFRESH_COOLDOWN: 60 * 1000,
    },

    elements: {}, // Init in initElements

    init() {
        console.log('App initializing...');
        this.initElements();
        this.loadToken();
        this.bindEvents();
        this.loadInitialData();
    },

    initElements() {
        this.elements = {
            wallGrid: document.querySelector('.wall-grid'),
            fab: document.querySelector('.fab'),

            // Modals
            modalWrite: document.getElementById('modal-write'),
            modalSettings: document.getElementById('modal-settings'),

            // Forms
            formWrite: document.getElementById('form-write'),
            formSettings: document.getElementById('form-settings'),

            // Inputs
            tokenInput: document.getElementById('token-input'),
            nicknameInput: document.getElementById('nickname'),
            contentInput: document.getElementById('content'),

            // Buttons
            refreshBtn: document.getElementById('refresh-btn'),
            settingsBtn: document.getElementById('settings-trigger'),
            clearTokenBtn: document.getElementById('clear-token-btn'),

            toast: document.querySelector('.toast'),
        };

        // Debug checks
        if (!this.elements.settingsBtn) console.error('Settings button not found!');
        if (!this.elements.refreshBtn) console.error('Refresh button not found!');
    },

    loadToken() {
        const savedToken = localStorage.getItem(this.constants.TOKEN_KEY);
        if (savedToken) {
            this.state.token = savedToken;
            if (this.elements.tokenInput) {
                this.elements.tokenInput.value = savedToken;
            }
        }
    },

    bindEvents() {
        const { elements } = this;

        const toggleModal = (modal, active) => {
            if (modal) {
                modal.classList.toggle('active', active);
                if (!active && modal.querySelector('form')) {
                    modal.querySelector('form').reset();
                    if (modal === elements.modalSettings && this.state.token) {
                        elements.tokenInput.value = this.state.token;
                    }
                }
            }
        };

        if (elements.fab) {
            elements.fab.addEventListener('click', () => toggleModal(elements.modalWrite, true));
        }

        if (elements.settingsBtn) {
            console.log('Binding settings click');
            elements.settingsBtn.addEventListener('click', () => toggleModal(elements.modalSettings, true));
        }

        document.querySelectorAll('.close-btn, .close-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const modal = document.getElementById(targetId);
                toggleModal(modal, false);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) toggleModal(overlay, false);
            });
        });

        if (elements.formWrite) {
            elements.formWrite.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (elements.formSettings) {
            elements.formSettings.addEventListener('submit', (e) => this.handleSaveSettings(e));
        }

        if (elements.clearTokenBtn) {
            elements.clearTokenBtn.addEventListener('click', () => this.handleClearToken());
        }

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', () => this.handleRefresh());
        }

        if (elements.wallGrid) {
            elements.wallGrid.addEventListener('click', (e) => {
                if (e.target.closest('.reply-btn')) {
                    const id = e.target.closest('.reply-btn').dataset.id;
                    this.handleReply(id);
                }
            });
        }
    },

    loadInitialData() {
        const cached = localStorage.getItem(this.constants.CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    this.state.messages = data;
                    this.renderMessages(data, true);
                    this.showToast('已加载缓存内容');
                    return;
                }
            } catch (e) { console.error(e); }
        }
        this.handleRefresh(true);
    },

    async handleRefresh(force = false) {
        if (this.state.isLoading) return;

        if (!this.state.token && !force) {
            const lastRefresh = parseInt(localStorage.getItem(this.constants.REFRESH_KEY) || '0');
            const diff = Date.now() - lastRefresh;
            if (diff < this.constants.REFRESH_COOLDOWN) {
                const remaining = Math.ceil((this.constants.REFRESH_COOLDOWN - diff) / 1000);
                this.showToast(`请等待 ${remaining} 秒后再刷新`);
                return;
            }
        }

        this.setLoading(true);
        if (this.elements.refreshBtn) this.elements.refreshBtn.classList.add('loading', 'disabled');

        try {
            const { owner, repo } = CONFIG;
            const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&page=1&per_page=20`;

            const headers = {};
            if (this.state.token) headers['Authorization'] = `token ${this.state.token}`;

            const res = await fetch(url, { headers });

            if (res.status === 403 || res.status === 401) {
                throw new Error(this.state.token ? 'Token 无效或权限不足' : '访问过于频繁，请稍后再试');
            }
            if (!res.ok) throw new Error('网络请求失败');

            const data = await res.json();
            const messages = data.filter(item => !item.pull_request);

            if (messages.length > 0) {
                this.state.messages = messages;
                this.saveCache(messages);
                this.renderMessages(messages, true);
                localStorage.setItem(this.constants.REFRESH_KEY, Date.now().toString());
                this.showToast(this.state.token ? '已更新 (VIP模式)' : '内容已更新');
            } else {
                this.renderEmpty();
            }

        } catch (error) {
            console.error(error);
            this.showToast(error.message);
        } finally {
            this.setLoading(false);
            if (this.elements.refreshBtn) this.elements.refreshBtn.classList.remove('loading', 'disabled');
        }
    },

    handleSaveSettings(e) {
        e.preventDefault();
        const token = this.elements.tokenInput.value.trim();
        if (token) {
            if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
                this.showToast('Token 格式可能不正确');
                // Allow basic validation but continue usually
            }
            localStorage.setItem(this.constants.TOKEN_KEY, token);
            this.state.token = token;
            // Close modal
            this.elements.modalSettings.classList.remove('active');
            this.showToast('Token 已保存，正在验证...');
            this.handleRefresh(true);
        } else {
            this.showToast('请输入 Token');
        }
    },

    handleClearToken() {
        localStorage.removeItem(this.constants.TOKEN_KEY);
        this.state.token = null;
        this.elements.tokenInput.value = '';
        this.showToast('Token 已清除');
        this.elements.modalSettings.classList.remove('active');
    },

    saveCache(data) {
        localStorage.setItem(this.constants.CACHE_KEY, JSON.stringify(data));
    },

    renderMessages(messages, clear = false) {
        if (clear && this.elements.wallGrid) this.elements.wallGrid.innerHTML = '';

        const fragment = document.createDocumentFragment();
        messages.forEach(msg => {
            const card = document.createElement('article');
            card.className = 'message-card';
            card.style.animationDelay = `${Math.random() * 0.3}s`;

            const date = new Date(msg.created_at).toLocaleDateString();
            const bodyPreview = msg.body ? msg.body : '（无内容）';

            card.innerHTML = `
        <div class="card-header">
          <span class="card-date">${date}</span>
          <span class="card-id">#${msg.number}</span>
        </div>
        <div class="card-body">${this.escapeHtml(bodyPreview)}</div>
        <div class="card-footer">
          <button class="reply-btn" data-id="${msg.number}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            回应
          </button>
        </div>
      `;
            fragment.appendChild(card);
        });

        if (this.elements.wallGrid) this.elements.wallGrid.appendChild(fragment);
    },

    renderEmpty() {
        if (this.elements.wallGrid) {
            this.elements.wallGrid.innerHTML = '<div class="state-box"><p>还没有人留下痕迹...</p></div>';
        }
    },

    setLoading(loading) {
        this.state.isLoading = loading;
    },

    async handleSubmit(e) {
        e.preventDefault();
        if (this.state.isSubmitting) return;

        const nickname = this.elements.nicknameInput.value || 'Anonymous';
        const content = this.elements.contentInput.value;

        if (!content.trim()) {
            this.showToast('写点什么吧...');
            return;
        }

        this.state.isSubmitting = true;
        const btn = this.elements.formWrite.querySelector('.btn-primary');
        const originalText = btn.textContent;
        btn.textContent = '发送中...';

        try {
            if (this.state.token || CONFIG.token) {
                await this.postToGitHub(nickname, content);
                this.showToast('发布成功！');
                if (this.elements.modalWrite) {
                    this.elements.modalWrite.classList.remove('active');
                    this.elements.formWrite.reset();
                }
                setTimeout(() => this.handleRefresh(true), 1500);
            } else {
                this.redirectToGitHub(nickname, content);
            }
        } catch (error) {
            console.error(error);
            this.showToast('发布失败：' + error.message);
        } finally {
            this.state.isSubmitting = false;
            btn.textContent = originalText;
        }
    },

    async postToGitHub(nickname, content) {
        const { owner, repo } = CONFIG;
        const token = this.state.token || CONFIG.token;

        const title = nickname === 'Anonymous' ? '来自陌生人的留言' : `${nickname} 的留言`;
        const body = `${content}\n\n---\n*By ${nickname} via Strangers*`;

        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, body })
        });

        if (!res.ok) throw new Error('API 请求失败');
    },

    redirectToGitHub(nickname, content) {
        const { owner, repo } = CONFIG;
        const title = nickname === 'Anonymous' ? '来自陌生人的留言' : `${nickname} 的留言`;
        const body = `${content}\n\n---\n*By ${nickname} via Strangers*`;
        const url = `https://github.com/${owner}/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
        this.showToast('正在前往 GitHub...');
        if (this.elements.modalWrite) this.elements.modalWrite.classList.remove('active');
    },

    handleReply(id) {
        const { owner, repo } = CONFIG;
        window.open(`https://github.com/${owner}/${repo}/issues/${id}`, '_blank');
    },

    showToast(msg) {
        const toast = this.elements.toast;
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 3000);
        }
    },

    escapeHtml(unsafe) {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
