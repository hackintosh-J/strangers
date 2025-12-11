// App Controller (V5: Cloudflare Edition)
const App = {
    state: {
        messages: [],
        isLoading: false,
        isSubmitting: false,
    },

    constants: {
        CACHE_KEY: 'strangers_cache_v5',
        REFRESH_KEY: 'strangers_last_refresh',
        REFRESH_COOLDOWN: 5 * 1000, // Reduced to 5s for better experience with powerful backend
    },

    elements: {},

    init() {
        this.initElements();
        this.bindEvents();
        this.loadInitialData();
    },

    initElements() {
        this.elements = {
            wallGrid: document.querySelector('.wall-grid'),
            fab: document.querySelector('.fab'),

            // Modals
            modalWrite: document.getElementById('modal-write'),

            // Forms
            formWrite: document.getElementById('form-write'),

            // Inputs
            nicknameInput: document.getElementById('nickname'),
            contentInput: document.getElementById('content'),

            // Buttons
            refreshBtn: document.getElementById('refresh-btn'),

            toast: document.querySelector('.toast'),
        };
    },

    bindEvents() {
        const { elements } = this;

        const toggleModal = (modal, active) => {
            if (modal) {
                modal.classList.toggle('active', active);
                if (!active && modal.querySelector('form')) {
                    modal.querySelector('form').reset();
                }
            }
        };

        if (elements.fab) {
            elements.fab.addEventListener('click', () => toggleModal(elements.modalWrite, true));
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

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', () => this.handleRefresh());
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
                    this.showToast('已加载缓存');
                    return;
                }
            } catch (e) { console.error(e); }
        }
        // Auto refresh if config is set
        if (CONFIG.apiUrl && CONFIG.apiUrl !== 'YOUR_WORKER_URL_HERE') {
            this.handleRefresh(true);
        } else {
            this.showToast('请配置 Worker API URL');
        }
    },

    async handleRefresh(force = false) {
        if (this.state.isLoading) return;

        // Check Config
        if (!CONFIG.apiUrl || CONFIG.apiUrl === 'YOUR_WORKER_URL_HERE') {
            this.showToast('未配置 API URL');
            return;
        }

        if (!force) {
            const lastRefresh = parseInt(localStorage.getItem(this.constants.REFRESH_KEY) || '0');
            const diff = Date.now() - lastRefresh;
            if (diff < this.constants.REFRESH_COOLDOWN) {
                this.showToast(`刷新太快了，歇一会儿吧`);
                return;
            }
        }

        this.setLoading(true);
        if (this.elements.refreshBtn) this.elements.refreshBtn.classList.add('loading', 'disabled');

        try {
            const res = await fetch(`${CONFIG.apiUrl}/api/messages`);
            if (!res.ok) throw new Error('Refresh failed');

            const messages = await res.json();

            if (messages.length > 0) {
                this.state.messages = messages;
                this.saveCache(messages);
                this.renderMessages(messages, true);
                localStorage.setItem(this.constants.REFRESH_KEY, Date.now().toString());
                this.showToast('更新成功');
            } else {
                this.renderEmpty();
            }

        } catch (error) {
            console.error(error);
            this.showToast('连接服务器失败');
        } finally {
            this.setLoading(false);
            if (this.elements.refreshBtn) this.elements.refreshBtn.classList.remove('loading', 'disabled');
        }
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
            // V5 Schema: content, nickname
            const bodyText = msg.content || '（无内容）';

            card.innerHTML = `
        <div class="card-header">
          <span class="card-date">${date}</span>
          <span class="card-id">#${msg.id}</span>
        </div>
        <div class="card-body">${this.escapeHtml(bodyText)}</div>
        <div class="card-footer" style="padding-top:0.5rem; border:none;">
           <span style="font-size:0.8rem; color: #888;">By ${this.escapeHtml(msg.nickname || 'Anonymous')}</span>
        </div>
      `;
            fragment.appendChild(card);
        });

        if (this.elements.wallGrid) this.elements.wallGrid.appendChild(fragment);
    },

    renderEmpty() {
        if (this.elements.wallGrid) {
            this.elements.wallGrid.innerHTML = '<div class="state-box"><p>一片荒原...</p></div>';
        }
    },

    setLoading(loading) {
        this.state.isLoading = loading;
    },

    async handleSubmit(e) {
        e.preventDefault();
        if (this.state.isSubmitting) return;

        if (!CONFIG.apiUrl || CONFIG.apiUrl === 'YOUR_WORKER_URL_HERE') {
            this.showToast('请先配置 API URL');
            return;
        }

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
            const res = await fetch(`${CONFIG.apiUrl}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, content })
            });

            if (!res.ok) throw new Error('发送失败');

            this.showToast('发布成功！');
            if (this.elements.modalWrite) {
                this.elements.modalWrite.classList.remove('active');
                this.elements.formWrite.reset();
            }
            setTimeout(() => this.handleRefresh(true), 500);

        } catch (error) {
            console.error(error);
            this.showToast('发布失败，请重试');
        } finally {
            this.state.isSubmitting = false;
            btn.textContent = originalText;
        }
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
