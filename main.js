(function () {
  const storageKeys = {
    lang: "strangers-lang",
    theme: "strangers-theme",
  };

  const supportedLangs = Object.keys(window.I18N.dictionary);
  const langButtons = Array.from(document.querySelectorAll('button[data-lang]'));
  const themeSelects = Array.from(document.querySelectorAll('select[id^="theme-select"]'));
  const i18nElements = Array.from(document.querySelectorAll('[data-i18n]'));
  const root = document.documentElement;

  const getStored = (key, fallback) => {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch (err) {
      return fallback;
    }
  };

  const setStored = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* ignore storage errors for private mode */
    }
  };

  function applyLanguage(lang) {
    if (!supportedLangs.includes(lang)) {
      lang = window.I18N.defaultLang;
    }

    document.documentElement.lang = lang === "zh" ? "zh" : "en";

    langButtons.forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.setAttribute("aria-pressed", active.toString());
    });

    const translations = window.I18N.dictionary[lang];
    i18nElements.forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });

    themeSelects.forEach((select) => {
      const labelText = translations.themeLabel;
      if (select.previousElementSibling?.matches("label")) {
        select.previousElementSibling.textContent = labelText;
      }
    });

    setStored(storageKeys.lang, lang);
  }

  function applyTheme(theme) {
    const validThemes = ["warm", "cool", "dark"];
    const selected = validThemes.includes(theme) ? theme : "warm";
    root.setAttribute("data-theme", selected);
    document.body.setAttribute("data-theme", selected);

    themeSelects.forEach((select) => {
      select.value = selected;
    });

    setStored(storageKeys.theme, selected);
  }

  function init() {
    const storedLang = getStored(storageKeys.lang, window.I18N.defaultLang);
    const storedTheme = getStored(storageKeys.theme, "warm");

    applyLanguage(storedLang);
    applyTheme(storedTheme);

    langButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        applyLanguage(btn.dataset.lang);
      });
      btn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          btn.click();
        }
      });
    });

    themeSelects.forEach((select) => {
      select.addEventListener("change", (event) => {
        applyTheme(event.target.value);
      });
      select.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && select.value) {
          applyTheme(select.value);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
