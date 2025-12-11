// 通用国际化字典，供无障碍页使用

const A11Y_I18N = {
  zh: {
    pageTitle: '可访问性演示',
    sectionTitle1: '介绍',
    sectionDesc1: '该页面演示了如何使用 aria 属性和键盘可操作控件来提高可访问性。',
    sectionTitle2: '说明',
    sectionDesc2: '通过上方按钮可以轮换主题颜色，选择下拉框可切换语言。所有控件都可通过键盘操作，并添加了 aria 标签。',
    footer: 'MIT 许可 · Hackintosh J',
  },
  en: {
    pageTitle: 'Accessibility Demo',
    sectionTitle1: 'Introduction',
    sectionDesc1: 'This page demonstrates how to use aria attributes and keyboard-operable controls to improve accessibility.',
    sectionTitle2: 'Description',
    sectionDesc2: 'Use the button above to cycle themes and select the dropdown to change language. All controls are keyboard friendly and labeled with aria attributes.',
    footer: 'MIT License · Hackintosh J',
  },
};

// 暴露到全局
window.A11Y_I18N = A11Y_I18N;