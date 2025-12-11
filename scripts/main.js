const languageToggle = document.getElementById("language-toggle");
const themeToggle = document.getElementById("theme-toggle");
const exportButton = document.getElementById("export-button");
const wallList = document.getElementById("warm-wall");
const scrollStatus = document.getElementById("scroll-status");
const form = document.getElementById("entry-form");

const messages = {
  zh: {
    eyebrow: "温暖墙",
    welcome: "欢迎来到温暖墙",
    lede: "在这里写下你的心情，接住别人递来的温暖。",
    toggleTheme: "切换主题",
    export: "导出数据",
    anonNote: "留言自动匿名显示，请放心分享你的故事。",
    wallLabel: "温暖墙列表",
    recent: "最新留言",
    scrollPrompt: "向下滚动查看更多留言",
    entryLabel: "留言入口",
    share: "写下你的心情",
    messageLabel: "留言",
    tagLabel: "想要留下的称呼（可为空）",
    submit: "发布",
    exportSuccess: "数据已导出为 JSON",
    languageButton: "English"
  },
  en: {
    eyebrow: "Warm Wall",
    welcome: "Welcome to the Warm Wall",
    lede: "Share how you feel and receive gentle words from others.",
    toggleTheme: "Toggle theme",
    export: "Export data",
    anonNote: "Posts are shown anonymously—share freely.",
    wallLabel: "Warm wall",
    recent: "Latest notes",
    scrollPrompt: "Scroll to read more notes",
    entryLabel: "Entry",
    share: "Write how you feel",
    messageLabel: "Message",
    tagLabel: "Name you'd like to show (optional)",
    submit: "Post",
    exportSuccess: "Data exported as JSON",
    languageButton: "中文"
  }
};

const defaultEntries = [
  { text: "今天遇到好朋友的问候，感觉一切都会变好。", author: "匿名", time: "刚刚" },
  { text: "加油，慢慢来，生活会给你惊喜。", author: "橙子", time: "10 分钟前" },
  { text: "如果你也在努力，请记得为自己喝彩。", author: "Someone", time: "30 分钟前" }
];

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    // 忽略存储异常
  }
}

function readPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (_) {
    return fallback;
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  savePreference("theme", theme);
  themeToggle.textContent = messages[currentLanguage].toggleTheme;
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
}

function applyLanguage(lang) {
  const dict = messages[lang];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
  languageToggle.textContent = dict.languageButton;
  savePreference("language", lang);
}

function renderEntries(entries) {
  wallList.innerHTML = "";
  entries.forEach(({ text, author, time }) => {
    const item = document.createElement("li");
    item.className = "wall__item";

    const meta = document.createElement("p");
    meta.className = "wall__meta";
    meta.innerHTML = `<span>${author || "匿名"}</span><span>${time}</span>`;

    const content = document.createElement("p");
    content.className = "wall__text";
    content.textContent = text;

    item.append(meta, content);
    wallList.appendChild(item);
  });
}

function exportData(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "warm-wall.json";
  link.click();
  URL.revokeObjectURL(url);
  scrollStatus.textContent = messages[currentLanguage].exportSuccess;
}

function handleScrollPrompt() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    scrollStatus.textContent = currentLanguage === "zh" ? "已经到底了" : "You reached the end";
  } else {
    scrollStatus.textContent = messages[currentLanguage].scrollPrompt;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const text = formData.get("message").trim();
  const author = formData.get("author").trim();
  if (!text) return;
  const entry = { text, author: author || "匿名", time: new Date().toLocaleTimeString() };
  entries.unshift(entry);
  renderEntries(entries);
  form.reset();
}

let entries = [...defaultEntries];
let currentLanguage = readPreference("language", "zh");

function init() {
  const savedTheme = readPreference("theme", "light");
  setTheme(savedTheme);
  applyLanguage(currentLanguage);
  renderEntries(entries);

  themeToggle.addEventListener("click", toggleTheme);
  languageToggle.addEventListener("click", () => {
    currentLanguage = currentLanguage === "zh" ? "en" : "zh";
    applyLanguage(currentLanguage);
  });
  exportButton.addEventListener("click", () => exportData(entries));
  form.addEventListener("submit", handleFormSubmit);
  document.addEventListener("scroll", handleScrollPrompt);
  handleScrollPrompt();
}

init();
