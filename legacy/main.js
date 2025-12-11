const STORAGE_KEY = 'myDraft';
const MAX_CONTENT_LENGTH = 500;
const ISSUE_REPO = 'OWNER/REPO';
const DISCUSSION_CATEGORY = 'General';

const form = document.getElementById('entry-form');
const emotionInput = document.getElementById('emotion');
const contentInput = document.getElementById('content');
const nicknameInput = document.getElementById('nickname');
const statusBox = document.getElementById('status');
const exportButton = document.getElementById('export-json');
const clearButton = document.getElementById('clear-storage');
const issueLink = document.getElementById('issue-link');
const discussionLink = document.getElementById('discussion-link');

function showStatus(message, type = 'info') {
  statusBox.textContent = message;
  statusBox.classList.remove('error', 'success');
  if (type === 'error') statusBox.classList.add('error');
  if (type === 'success') statusBox.classList.add('success');
}

function getDraftFromForm() {
  const emotion = emotionInput.value.trim();
  const content = contentInput.value.trim();
  const nickname = nicknameInput.value.trim();

  return {
    emotion,
    content,
    nickname,
    updatedAt: new Date().toISOString(),
  };
}

function buildTemplateStrings(draft) {
  const emotionLabel = draft.emotion || '未注明情绪';
  const nicknameLabel = draft.nickname || '匿名';
  const titleSnippet = draft.content ? draft.content.slice(0, 30) : '';
  const title = `${emotionLabel} · ${nicknameLabel}的投稿${titleSnippet ? '：' + titleSnippet : ''}`;

  const bodyLines = [
    `情绪：${emotionLabel}`,
    `正文：\n${draft.content}`,
    `昵称：${nicknameLabel}`,
    '',
    '（此内容来自“写下一段话”页面的本地草稿模板）',
  ];

  return { title, body: bodyLines.join('\n') };
}

function updateLinks(draft) {
  const hasContent = Boolean(draft && draft.content);
  const { title, body } = buildTemplateStrings(draft || { emotion: '', content: '', nickname: '' });
  const issueUrl = new URL(`https://github.com/${ISSUE_REPO}/issues/new`);
  issueUrl.searchParams.set('title', title);
  issueUrl.searchParams.set('body', body);

  const discussionUrl = new URL(`https://github.com/${ISSUE_REPO}/discussions/new`);
  discussionUrl.searchParams.set('category', DISCUSSION_CATEGORY);
  discussionUrl.searchParams.set('title', title);
  discussionUrl.searchParams.set('body', body);

  setLink(issueLink, issueUrl.toString(), hasContent);
  setLink(discussionLink, discussionUrl.toString(), hasContent);
}

function setLink(node, url, enabled) {
  node.href = enabled ? url : '#';
  node.classList.toggle('disabled', !enabled);
  node.setAttribute('aria-disabled', String(!enabled));
}

function saveDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    console.error('读取草稿失败', error);
    return null;
  }
}

function fillForm(draft) {
  if (!draft) return;
  emotionInput.value = draft.emotion || '';
  contentInput.value = draft.content || '';
  nicknameInput.value = draft.nickname || '';
}

function validateDraft(draft) {
  if (!draft.content) {
    return '正文不能为空。';
  }

  if (draft.content.length > MAX_CONTENT_LENGTH) {
    return `正文请控制在 ${MAX_CONTENT_LENGTH} 字以内。`;
  }

  if (draft.nickname && draft.nickname.length > 50) {
    return '昵称长度超过上限。';
  }

  return '';
}

function handleSubmit(event) {
  event.preventDefault();
  const draft = getDraftFromForm();
  const errorMessage = validateDraft(draft);
  if (errorMessage) {
    showStatus(errorMessage, 'error');
    return;
  }

  saveDraft(draft);
  updateLinks(draft);
  showStatus('草稿已保存到本地的“我的草稿”。点击下面的链接即可跳转到 GitHub 预填表单发布。', 'success');
}

function exportDraft() {
  const draft = loadDraft();
  if (!draft) {
    showStatus('没有可导出的草稿。', 'error');
    return;
  }

  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-draft.json';
  link.click();
  URL.revokeObjectURL(url);
  showStatus('已导出当前草稿为 JSON 文件。', 'success');
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  updateLinks({ emotion: '', content: '', nickname: '' });
  showStatus('本地数据已清除。', 'success');
}

function init() {
  const draft = loadDraft();
  if (draft) {
    fillForm(draft);
    updateLinks(draft);
    showStatus('已从本地加载“我的草稿”。');
  } else {
    updateLinks({ emotion: '', content: '', nickname: '' });
    showStatus('暂无草稿，填写后提交即可保存到本地。');
  }

  form.addEventListener('submit', handleSubmit);
  exportButton.addEventListener('click', exportDraft);
  clearButton.addEventListener('click', clearDraft);
}

init();
