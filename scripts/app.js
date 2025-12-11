// App Controller
const App = {
    state: {
        messages: [],
        page: 1,
        isLoading: false,
        hasMore: true,
        isSubmitting: false,
    },

    constants: {
        CACHE_KEY: 'strangers_cache_v1',
        REFRESH_KEY: 'strangers_last_refresh',
        REFRESH_COOLDOWN: 60 * 1000, // 60 seconds
    },

    elements: {
        wallGrid: document.querySelector('.wall-grid'),
        fab: document.querySelector('.fab'),
        modalOverlay: document.querySelector('.modal-overlay'),
        closeBtn: document.querySelector('.close-btn'),
        cancelBtn: document.querySelector('.btn-secondary'),
        form: document.querySelector('.modal-form'),
        toast: document.querySelector('.toast'),
        refreshBtn: document.getElementById('refresh-btn'),
    },

    init() {
        this.bindEvents();
        this.loadInitialData();
    },

    bindEvents() {
        // Modal controls
        const openModal = () => this.elements.modalOverlay.classList.add('active');
        const closeModal = () => {
            this.elements.modalOverlay.classList.remove('active');
            this.elements.form.reset();
        };

        this.elements.fab.addEventListener('click', openModal);
        this.elements.closeBtn.addEventListener('click', closeModal);
        this.elements.cancelBtn.addEventListener('click', closeModal);
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) closeModal();
        });

        // Form submission
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Refresh Button
        this.elements.refreshBtn.addEventListener('click', () => this.handleRefresh());

        // Reply delegation
        this.elements.wallGrid.addEventListener('click', (e) => {
            if (e.target.closest('.reply-btn')) {
                const id = e.target.closest('.reply-btn').dataset.id;
                this.handleReply(id);
            }
        });
    },

    loadInitialData() {
        // Try to load from cache first
        const cached = localStorage.getItem(this.constants.CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    this.state.messages = data;
                    this.renderMessages(data, true); // true = clear existing
                    this.showToast('已加载缓存内容');
                    return;
                }
            } catch (e) {
                console.error('Cache parse error', e);
            }
        }

        // If no cache, fetch fresh data
        this.handleRefresh(true);
    },

    async handleRefresh(force = false) {
        if (this.state.isLoading) return;

        if (!force) {
            const lastRefresh = parseInt(localStorage.getItem(this.constants.REFRESH_KEY) || '0');
            const now = Date.now();
            const diff = now - lastRefresh;

            if (diff < this.constants.REFRESH_COOLDOWN) {
                const remaining = Math.ceil((this.constants.REFRESH_COOLDOWN - diff) / 1000);
                this.showToast(`请等待 ${remaining} 秒后再刷新`);
                return;
            }
        }

        this.setLoading(true);
        // Add loading animation to button
        this.elements.refreshBtn.classList.add('loading');
        this.elements.refreshBtn.classList.add('disabled');

        try {
            const { owner, repo } = CONFIG;
            // Always fetch page 1 on refresh
            const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&page=1&per_page=20`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Refresh failed');

            const data = await res.json();
            const messages = data.filter(item => !item.pull_request);

            if (messages.length > 0) {
                this.state.messages = messages;
                this.saveCache(messages);
                this.renderMessages(messages, true);

                // Update refresh timestamp
                localStorage.setItem(this.constants.REFRESH_KEY, Date.now().toString());
                this.showToast('内容已更新');
            } else {
                this.renderEmpty();
            }

        } catch (error) {
            console.error(error);
            this.showToast('刷新失败，请检查网络');
        } finally {
            this.setLoading(false);
            this.elements.refreshBtn.classList.remove('loading');
            this.elements.refreshBtn.classList.remove('disabled');
        }
    },

    saveCache(data) {
        localStorage.setItem(this.constants.CACHE_KEY, JSON.stringify(data));
    },

    renderMessages(messages, clear = false) {
        if (clear) {
            this.elements.wallGrid.innerHTML = '';
        }

        const fragment = document.createDocumentFragment();
        messages.forEach(msg => {
            const card = document.createElement('article');
            card.className = 'message-card';
            card.style.animationDelay = `${Math.random() * 0.3}s`; // Stagger effect

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
        this.elements.wallGrid.appendChild(fragment);
    },

    renderEmpty() {
        this.elements.wallGrid.innerHTML = `
      <div class="state-box">
        <p>还没有人留下痕迹...</p>
      </div>
    `;
    },

    setLoading(loading) {
        this.state.isLoading = loading;
        const existingLoader = document.querySelector('.loader-sentinel');
        if (loading && !existingLoader) {
            // Add loading indicator at bottom only if not refreshing (refresh btn handles its own spinner)
            // Actually, for manual refresh, maybe we don't need a bottom loader, just the button spinner.
            // But let's keep it minimal.
        } else if (!loading && existingLoader) {
            existingLoader.remove();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        if (this.state.isSubmitting) return;

        const nickname = document.getElementById('nickname').value || 'Anonymous';
        const content = document.getElementById('content').value;

        if (!content.trim()) {
            this.showToast('写点什么吧...');
            return;
        }

        this.state.isSubmitting = true;
        const btn = this.elements.form.querySelector('.btn-primary');
        const originalText = btn.textContent;
        btn.textContent = '发送中...';

        try {
            if (CONFIG.token) {
                // Direct API Mode
                await this.postToGitHub(nickname, content);
                this.showToast('已发布！');
                this.elements.modalOverlay.classList.remove('active');
                this.elements.form.reset();
                // Trigger manual refresh ignoring cooldown? No, GitHub API has delay.
                // Let's force a refresh after a short delay.
                setTimeout(() => this.handleRefresh(true), 1000);
            } else {
                // Fallback Mode
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
        const { owner, repo, token } = CONFIG;
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

        if (!res.ok) throw new Error('Failed to post');
    },

    redirectToGitHub(nickname, content) {
        const { owner, repo } = CONFIG;
        const title = nickname === 'Anonymous' ? '来自陌生人的留言' : `${nickname} 的留言`;
        const body = `${content}\n\n---\n*By ${nickname} via Strangers*`;

        // Check Config first
        if (!owner || !repo) {
            this.showToast('请先配置 config.js');
            return;
        }

        const url = `https://github.com/${owner}/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
        this.showToast('正在前往 GitHub...');
        this.elements.modalOverlay.classList.remove('active');
    },

    handleReply(id) {
        const { owner, repo } = CONFIG;
        window.open(`https://github.com/${owner}/${repo}/issues/${id}`, '_blank');
    },

    showToast(msg) {
        const toast = this.elements.toast;
        toast.textContent = msg;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
