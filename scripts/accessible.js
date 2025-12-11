// 无障碍页面脚本
(function () {
  const langSelect = document.getElementById('a11y-lang-select');
  const themeToggle = document.getElementById('a11y-theme-toggle');
  const themes = ['warm', 'cool', 'dark'];
  let currentThemeIndex = 0;

  function applyTheme(theme) {
    const html = document.documentElement;
    html.classList.remove('theme-warm', 'theme-cool', 'theme-dark');
    html.classList.add('theme-' + theme);
    localStorage.setItem('a11y-theme', theme);
    currentThemeIndex = themes.indexOf(theme);
    themeToggle.setAttribute('aria-pressed', 'true');
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const theme = themes[currentThemeIndex];
    applyTheme(theme);
  }

  function applyLanguage(lang) {
    const dict = window.A11Y_I18N[lang] || window.A11Y_I18N.zh;
    document.getElementById('page-title').textContent = dict.pageTitle;
    document.getElementById('a11y-section-title-1').textContent = dict.sectionTitle1;
    document.getElementById('a11y-section-desc-1').textContent = dict.sectionDesc1;
    document.getElementById('a11y-section-title-2').textContent = dict.sectionTitle2;
    document.getElementById('a11y-section-desc-2').textContent = dict.sectionDesc2;
    document.getElementById('a11y-footer-text').textContent = dict.footer;
    localStorage.setItem('a11y-lang', lang);
  }

  langSelect.addEventListener('change', (e) => {
    applyLanguage(e.target.value);
  });

  themeToggle.addEventListener('click', cycleTheme);

  function init() {
    // 初始语言
    const storedLang = localStorage.getItem('a11y-lang') || langSelect.value;
    langSelect.value = storedLang;
    applyLanguage(storedLang);
    // 初始主题
    const storedTheme = localStorage.getItem('a11y-theme');
    if (storedTheme && themes.includes(storedTheme)) {
      applyTheme(storedTheme);
    } else {
      applyTheme(themes[currentThemeIndex]);
    }
  }

  init();
})();