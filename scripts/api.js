// API helper for温暖墙
// 尝试从 GitHub 获取留言，若失败则由调用方提供本地示例。

const STRANGERS_OWNER = 'hackintosh-J';
const STRANGERS_REPO = 'strangers';

/**
 * 从 GitHub 仓库 issues 拉取留言。
 * 为简单起见，只读取标题和正文作为留言内容。
 * @param {number} page 页码，从 1 开始
 * @param {number} perPage 每页条数
 * @returns {Promise<Array<{id:number, body:string}>>}
 */
async function fetchGitHubMessages(page = 1, perPage = 10) {
  const url = `https://api.github.com/repos/${STRANGERS_OWNER}/${STRANGERS_REPO}/issues?page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub 请求失败：${res.status}`);
  const data = await res.json();
  return data
    .filter((item) => !item.pull_request) // 过滤掉 PR
    .map((item) => ({ id: item.id, body: item.title || item.body || '' }));
}

/**
 * 获取留言列表。首先尝试从 GitHub 获取，失败时抛出错误，由调用方决定回退策略。
 * @param {number} page
 * @returns {Promise<Array<{id:number, body:string}>>}
 */
async function fetchMessages(page = 1) {
  return await fetchGitHubMessages(page, 10);
}

// 将函数暴露到全局
window.fetchMessages = fetchMessages;