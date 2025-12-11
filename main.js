import { fetchCommunityFeed, normalizeCardData } from './scripts/api.js';

const warmWall = document.querySelector('#warm-wall');
const cardList = document.querySelector('#warm-wall-list');
const statusText = document.querySelector('#warm-wall-status');
const loadMoreButton = document.querySelector('#load-more');

const fallbackSamples = [
  {
    id: 'local-1',
    title: '欢迎来到温暖墙',
    author: '匿名',
    body: '在这里写下你的故事、鼓励或想说的话，每一条留言都是一份温暖。',
    createdAt: new Date().toISOString(),
    labels: ['鼓励'],
  },
  {
    id: 'local-2',
    title: '谢谢倾听',
    author: '温柔的陌生人',
    body: '有时候倾诉比答案更重要，谢谢你在这里陪伴。',
    createdAt: new Date().toISOString(),
    labels: ['倾听'],
  },
];

const state = {
  page: 1,
  perPage: 6,
  loading: false,
  finished: false,
  items: [],
  error: null,
};

async function loadCards() {
  if (state.loading || state.finished) return;
  state.loading = true;
  updateStatus('正在加载中…');
  if (loadMoreButton) {
    loadMoreButton.disabled = true;
  }

  try {
    const feed = await fetchCommunityFeed({
      owner: 'vercel',
      repo: 'next.js',
      page: state.page,
      perPage: state.perPage,
      source: 'issues',
    });

    const cards = feed.map(normalizeCardData);
    if (!cards.length) {
      state.finished = true;
      updateStatus('已经到底了，感谢浏览。');
      return;
    }

    state.items.push(...cards);
    state.page += 1;
    renderCards(cards);
    updateStatus('');
  } catch (error) {
    console.error('读取 GitHub 内容失败：', error);
    state.error = error;
    showFallback(error);
  } finally {
    state.loading = false;
    if (loadMoreButton) {
      loadMoreButton.disabled = state.finished;
    }
  }
}

function renderCards(cards) {
  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    const item = document.createElement('article');
    item.className = 'warm-card';

    const header = document.createElement('header');
    header.className = 'warm-card__header';
    const createdAt = card.createdAt ? new Date(card.createdAt) : new Date();
    header.innerHTML = `
      <div class="warm-card__title">${card.title}</div>
      <div class="warm-card__meta">由 ${card.author || '匿名'} 在 ${createdAt.toLocaleDateString()} 发布</div>
    `;

    const body = document.createElement('p');
    body.className = 'warm-card__body';
    body.textContent = card.body;

    const labels = document.createElement('div');
    labels.className = 'warm-card__labels';
    (card.labels || []).forEach((label) => {
      const tag = document.createElement('span');
      tag.className = 'warm-card__label';
      tag.textContent = label;
      labels.appendChild(tag);
    });

    item.append(header, body, labels);
    fragment.appendChild(item);
  });

  cardList.appendChild(fragment);
}

function showFallback(error) {
  if (!state.items.length) {
    renderCards(fallbackSamples);
  }

  const message = error?.status === 403
    ? '访问频率受限，稍后再试或使用本地示例。'
    : '暂时无法连接网络，已展示本地示例数据。';
  updateStatus(message);
}

function updateStatus(text) {
  statusText.textContent = text;
}

function setupLoadMore() {
  loadMoreButton?.addEventListener('click', () => {
    loadCards();
  });
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadCards();
        }
      });
    },
    { rootMargin: '200px' }
  );

  if (loadMoreButton) {
    observer.observe(loadMoreButton);
  }
}

function init() {
  if (!warmWall || !cardList) return;
  setupLoadMore();
  setupInfiniteScroll();
  loadCards();
}

init();
