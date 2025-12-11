// App Controller
const App = {
    state: {
        messages: [],
        page: 1,
        isLoading: false,
        hasMore: true,
        isSubmitting: false,
    },

    elements: {
        wallGrid: document.querySelector('.wall-grid'),
        fab: document.querySelector('.fab'),
        modalOverlay: document.querySelector('.modal-overlay'),
        closeBtn: document.querySelector('.close-btn'),
        cancelBtn: document.querySelector('.btn-secondary'),
        form: document.querySelector('.modal-form'),
        toast: document.querySelector('.toast'),
    },

    init() {
        this.bindEvents();
        this.loadMessages();
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

        // Infinite Scroll
        window.addEventListener('scroll', () => {
            if (this.state.isLoading || !this.state.hasMore) return;
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                this.loadMessages();
            }
        });

        // Reply delegation
        this.elements.wallGrid.addEventListener('click', (e) => {
            if (e.target.closest('.reply-btn')) {
                const id = e.target.closest('.reply-btn').dataset.id;
                this.handleReply(id);
            }
        });
    },

    async loadMessages() {
        this.setLoading(true);
        try {
            const { owner, repo } = CONFIG;
            // Fetch open issues excluding PRs
            const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&page=${this.state.page}&per_page=12`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('API Rate Limit or Network Error');

            const data = await res.json();
            const messages = data.filter(item => !item.pull_request);

            if (messages.length === 0) {
                this.state.hasMore = false;
                if (this.state.page === 1) this.renderEmpty();
            } else {
                this.renderMessages(messages);
                this.state.page++;
            }
        } catch (error) {
            console.error(error);
            this.showToast('无法加载内容，请稍后再试');
        } finally {
            this.setLoading(false);
        }
    },

    renderMessages(messages) {
        const fragment = document.createDocumentFragment();
        messages.forEach(msg => {
            const card = document.createElement('article');
            card.className = 'message-card';
            card.style.animationDelay = `${Math.random() * 0.3}s`; // Stagger effect

            const date = new Date(msg.created_at).toLocaleDateString();

            // Basic secure markdown-like parsing (stripping HTML tags for safety if innerHTML used, but we stick to textContent for body usually, or simple regex)
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
        const existing precise-loader = document.querySelector('.loader-sentinel');
        if (loading) {
            // Add loading indicator at bottom
            const loader = document.createElement('div');
            loader.className = 'state-box loader-sentinel';
            loader.innerHTML = '<div class="spinner"></div>';
            this.elements.wallGrid.parentNode.appendChild(loader);
        } else {
            if (document.querySelector('.loader-sentinel')) {
                document.querySelector('.loader-sentinel').remove();
            }
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
                // Refresh cleanly
                this.elements.wallGrid.innerHTML = '';
                this.state.page = 1;
                this.state.hasMore = true;
                this.loadMessages();
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

        const url = `https://github.com/${owner}/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
        this.showToast('正在前往 GitHub...');
        this.elements.modalOverlay.classList.remove('active');
    },

    handleReply(id) {
        const { owner, repo } = CONFIG;
        // For replies, we usually just link to the issue to keep it simple, 
        // or we could use the token to post a comment if implemented.
        // For V2, let's keep it robust: link to the issue page.
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
