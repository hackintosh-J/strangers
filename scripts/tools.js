// 伙伴角逻辑

// 随机暖语
const messages = [
  '愿你的每一次努力都有回应。',
  '有人偷偷为你加油，请你也不要放弃自己。',
  '睡前的星星会替我告诉你：今天也辛苦了。',
  '风会停，雨会歇，一切都会迎来晴朗的时候。',
  '慢慢来没关系，重要的是一直在路上。',
  '别急着否定自己，你已经比昨天勇敢。',
  '当你觉得无人理解时，记得你还有自己。',
  '今天的小步伐，会成就明天的大梦想。',
  '生活偶尔撒野，但你可以选择温柔以对。',
];

const messageEl = document.getElementById('random-message');
document.getElementById('get-message').addEventListener('click', () => {
  const pick = messages[Math.floor(Math.random() * messages.length)];
  messageEl.textContent = pick;
});

// 呼吸练习
const breathInstruction = document.getElementById('breath-instruction');
let breathTimer = null;
let breathStep = 0;

function updateBreath() {
  const steps = ['吸气', '屏息', '呼气', '屏息'];
  breathInstruction.textContent = `${steps[breathStep]} 4 秒`; // optional show seconds
  breathStep = (breathStep + 1) % steps.length;
}

document.getElementById('start-breath').addEventListener('click', () => {
  if (breathTimer) {
    clearInterval(breathTimer);
    breathTimer = null;
    breathInstruction.textContent = '已停止。再次点击重新开始。';
  } else {
    breathStep = 0;
    updateBreath();
    breathTimer = setInterval(updateBreath, 4000);
  }
});

// 随机歌单
const playlists = [
  { name: '轻松早晨 ☕️', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0' },
  { name: '放松心情 🎧', url: 'https://open.spotify.com/playlist/37i9dQZF1DWVrtsSlLKzro' },
  { name: '睡前柔和 🌙', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
];

const playlistLink = document.getElementById('playlist-link');
function setRandomPlaylist() {
  const p = playlists[Math.floor(Math.random() * playlists.length)];
  playlistLink.textContent = p.name;
  playlistLink.href = p.url;
}
document.getElementById('change-playlist').addEventListener('click', setRandomPlaylist);
// 初始化歌单链接
setRandomPlaylist();

// 微小幸福
const joyInput = document.getElementById('joy-input');
const addJoyBtn = document.getElementById('add-joy');
const joyList = document.getElementById('joy-list');
const clearJoysBtn = document.getElementById('clear-joys');
const JOY_KEY = 'strangers-joys';

function loadJoys() {
  try {
    const raw = localStorage.getItem(JOY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveJoys(list) {
  localStorage.setItem(JOY_KEY, JSON.stringify(list));
}

function renderJoys(list) {
  joyList.innerHTML = '';
  for (const joy of list) {
    const li = document.createElement('li');
    li.textContent = joy;
    joyList.appendChild(li);
  }
}

function initJoys() {
  const joys = loadJoys();
  renderJoys(joys);
}

addJoyBtn.addEventListener('click', () => {
  const text = joyInput.value.trim();
  if (!text) return;
  const joys = loadJoys();
  joys.push(text);
  saveJoys(joys);
  renderJoys(joys);
  joyInput.value = '';
});

clearJoysBtn.addEventListener('click', () => {
  localStorage.removeItem(JOY_KEY);
  renderJoys([]);
});

// 初始化微小幸福列表
initJoys();