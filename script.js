const quoteEl = document.getElementById('quote');
const refreshQuoteBtn = document.getElementById('refreshQuote');
const avatarPreview = document.getElementById('avatarPreview');
const avatarEmojiInput = document.getElementById('avatarEmoji');
const avatarUrlInput = document.getElementById('avatarUrl');
const bgColorInput = document.getElementById('bgColor');
const accentColorInput = document.getElementById('accentColor');
const resetPrefsBtn = document.getElementById('resetPrefs');
const registerSwBtn = document.getElementById('registerSwBtn');
const swStatus = document.getElementById('swStatus');

const PREF_KEYS = {
  emoji: 'strangers-avatar-emoji',
  url: 'strangers-avatar-url',
  bg: 'strangers-bg',
  accent: 'strangers-accent',
};

const warmthEndpoint = '/warmth-sentences.json';

async function fetchWarmSentence() {
  try {
    const response = await fetch(warmthEndpoint, { cache: 'no-cache' });
    if (!response.ok) throw new Error('响应异常');
    const sentences = await response.json();
    if (!Array.isArray(sentences) || sentences.length === 0) throw new Error('无数据');
    const pick = sentences[Math.floor(Math.random() * sentences.length)];
    quoteEl.textContent = pick;
  } catch (error) {
    quoteEl.textContent = `离线模式：使用缓存或本地数据。(${error.message})`;
  }
}

function applyAvatar() {
  const emoji = localStorage.getItem(PREF_KEYS.emoji) || '🌟';
  const url = localStorage.getItem(PREF_KEYS.url);
  avatarEmojiInput.value = emoji !== '🌟' ? emoji : '';
  avatarUrlInput.value = url || '';
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '自定义头像';
    avatarPreview.replaceChildren(img);
  } else {
    avatarPreview.textContent = emoji;
  }
}

function applyTheme() {
  const bg = localStorage.getItem(PREF_KEYS.bg) || '#0f1226';
  const accent = localStorage.getItem(PREF_KEYS.accent) || '#ff9e6d';
  bgColorInput.value = bg;
  accentColorInput.value = accent;
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--accent', accent);
}

function persistPrefs() {
  const emoji = avatarEmojiInput.value.trim() || '🌟';
  const url = avatarUrlInput.value.trim();
  const bg = bgColorInput.value;
  const accent = accentColorInput.value;
  localStorage.setItem(PREF_KEYS.emoji, emoji);
  if (url) {
    localStorage.setItem(PREF_KEYS.url, url);
  } else {
    localStorage.removeItem(PREF_KEYS.url);
  }
  localStorage.setItem(PREF_KEYS.bg, bg);
  localStorage.setItem(PREF_KEYS.accent, accent);
  applyAvatar();
  applyTheme();
}

function resetPrefs() {
  Object.values(PREF_KEYS).forEach((key) => localStorage.removeItem(key));
  avatarEmojiInput.value = '';
  avatarUrlInput.value = '';
  applyAvatar();
  applyTheme();
}

function autoRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    swStatus.textContent = '当前浏览器不支持 Service Worker。';
    registerSwBtn.disabled = true;
    return;
  }

  navigator.serviceWorker
    .register('/service-worker.js')
    .then((reg) => {
      swStatus.textContent = `Service Worker 已注册，作用域 ${reg.scope}`;
    })
    .catch((err) => {
      swStatus.textContent = `注册失败：${err.message}`;
    });
}

refreshQuoteBtn.addEventListener('click', fetchWarmSentence);
[avatarEmojiInput, avatarUrlInput, bgColorInput, accentColorInput].forEach((el) => {
  el.addEventListener('input', persistPrefs);
});
resetPrefsBtn.addEventListener('click', resetPrefs);
registerSwBtn.addEventListener('click', autoRegisterServiceWorker);

applyAvatar();
applyTheme();
fetchWarmSentence();
autoRegisterServiceWorker();
