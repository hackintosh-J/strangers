const warmthLines = [
  '今天的云很温柔，希望你也一样被温柔以待。',
  '慢一点没关系，抬头看看天空，深呼吸。',
  '你已经做得很好了，哪怕只迈出一小步。',
  '别忘了爱自己，哪怕只是喝一杯温水。',
  '休息也是向前走的一部分，允许自己停一停。',
  '有人在为你加油，那个“人”也可以是现在的你。',
  '世界有点吵，闭上眼睛听听自己的心跳。',
  '不必完美，保持柔软就很好。',
];

const playlists = [
  {
    title: '轻柔原声集',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX36edUJpD76c',
  },
  {
    title: 'lofi 学习 / 午后咖啡',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT',
  },
  {
    title: '深夜疗愈 Piano',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX5q67ZpWY1ab',
  },
  {
    title: '日落后的小旅行',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0BcQWzuB7ZO',
  },
  {
    title: '写给自己的一封情书',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX5l9rcXWdrth',
  },
  {
    title: '雨声白噪音',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX5KpP2LN299J',
  },
];

const joysKey = 'tiny-joys';

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function renderWarmth() {
  const textEl = document.getElementById('warmth-text');
  textEl.textContent = pickRandom(warmthLines);
}

function renderPlaylist() {
  const listEl = document.getElementById('playlist-list');
  listEl.innerHTML = '';
  const { title, url } = pickRandom(playlists);
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = title;
  item.appendChild(link);
  listEl.appendChild(item);
}

let breathTimer = null;
let breathStep = 0;
const breathPhases = ['吸气 4 秒', '屏息 4 秒', '呼气 4 秒', '停留 4 秒'];

function startBreathing() {
  const display = document.getElementById('breath-display');
  clearInterval(breathTimer);
  breathStep = 0;
  updateBreath(display);
  breathTimer = setInterval(() => {
    breathStep = (breathStep + 1) % breathPhases.length;
    updateBreath(display);
  }, 4000);
}

function updateBreath(display) {
  display.textContent = breathPhases[breathStep];
}

function loadJoys() {
  try {
    const stored = localStorage.getItem(joysKey);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('无法读取小确幸记录', e);
    return [];
  }
}

function saveJoys(joys) {
  localStorage.setItem(joysKey, JSON.stringify(joys));
}

function renderJoys() {
  const joys = loadJoys();
  const listEl = document.getElementById('joy-list');
  listEl.innerHTML = '';

  if (!joys.length) {
    const empty = document.createElement('li');
    empty.textContent = '还没有记录，写下第一件让你开心的小事吧。';
    listEl.appendChild(empty);
    return;
  }

  joys.forEach((joy) => {
    const item = document.createElement('li');
    item.textContent = joy.text;
    const time = document.createElement('span');
    time.textContent = joy.time;
    item.appendChild(time);
    listEl.appendChild(item);
  });
}

function handleJoySubmit(event) {
  event.preventDefault();
  const input = document.getElementById('joy-input');
  const value = input.value.trim();
  if (!value) return;

  const joys = loadJoys();
  const now = new Date();
  const next = [
    {
      text: value,
      time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`,
    },
    ...joys,
  ].slice(0, 3);

  saveJoys(next);
  renderJoys();
  input.value = '';
}

function initTools() {
  renderWarmth();
  renderPlaylist();
  renderJoys();

  document.getElementById('refresh-warmth').addEventListener('click', renderWarmth);
  document.getElementById('refresh-playlist').addEventListener('click', renderPlaylist);
  document.getElementById('start-breath').addEventListener('click', startBreathing);
  document.getElementById('joy-form').addEventListener('submit', handleJoySubmit);
}

document.addEventListener('DOMContentLoaded', initTools);
