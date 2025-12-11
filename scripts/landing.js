// 主题与多语言切换逻辑

(function () {
  const themeSelect = document.getElementById('theme-select');
  const langSelect = document.getElementById('lang-select');

  // 多语言字典
  const i18n = {
    zh: {
      heroTitle: '欢迎来到 Strangers',
      heroDesc: '这是一个支持主题切换和多语言的示例主页。',
      sectionTitle1: '功能说明',
      sectionDesc1: '通过下方的下拉菜单切换不同的主题风格和界面语言，体验个性化的 UI。',
      sectionTitle2: '其他页面',
      sectionDesc2: '使用导航可以前往温暖墙、伙伴角等更多功能。',
      footer: 'MIT License · Hackintosh J',
    },
    en: {
      heroTitle: 'Welcome to Strangers',
      heroDesc: 'This is a demo homepage supporting theme and language switching.',
      sectionTitle1: 'Feature Introduction',
      sectionDesc1: 'Use the dropdowns below to change the color theme and interface language and experience a personalized UI.',
      sectionTitle2: 'Other Pages',
      sectionDesc2: 'Use the navigation to visit the warm wall, companion corner and more.',
      footer: 'MIT License · Hackintosh J',
    },
  };

  function applyLanguage(lang) {
    const dict = i18n[lang] || i18n.zh;
    document.getElementById('hero-title').textContent = dict.heroTitle;
    document.getElementById('hero-desc').textContent = dict.heroDesc;
    document.getElementById('section-title-1').textContent = dict.sectionTitle1;
    document.getElementById('section-desc-1').textContent = dict.sectionDesc1;
    document.getElementById('section-title-2').textContent = dict.sectionTitle2;
    document.getElementById('section-desc-2').textContent = dict.sectionDesc2;
    document.getElementById('footer-text').textContent = dict.footer;
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    html.classList.remove('warm', 'cool', 'dark');
    if (theme === 'warm') html.classList.add('warm');
    if (theme === 'cool') html.classList.add('cool');
    if (theme === 'dark') html.classList.add('dark');
  }

  function loadPrefs() {
    const storedTheme = localStorage.getItem('strangers-theme');
    const storedLang = localStorage.getItem('strangers-lang');
    if (storedTheme) {
      themeSelect.value = storedTheme;
      applyTheme(storedTheme);
    }
    if (storedLang) {
      langSelect.value = storedLang;
      applyLanguage(storedLang);
    }
  }

  themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    localStorage.setItem('strangers-theme', theme);
    applyTheme(theme);
  });

  langSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    localStorage.setItem('strangers-lang', lang);
    applyLanguage(lang);
  });

  // 初始化
  applyLanguage(langSelect.value);
  applyTheme(themeSelect.value);
  loadPrefs();
})();