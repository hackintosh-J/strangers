// 温暖墙页面逻辑

const messagesContainer = document.getElementById('messages');
const loadMoreBtn = document.getElementById('load-more');
let currentPage = 1;

// 本地示例数据，作为离线回退
const sampleMessages = [
  '愿你的每一次努力都有回应，每一次等待都有结果。',
  '睡前的星星会替我告诉你：今天也辛苦了，晚安。',
  '有人偷偷为你加油，请你也不要放弃自己。',
  '风会停，雨会歇，一切都会迎来晴朗的时候。',
  '别急着否定自己，你已经比昨天勇敢。',
  '在你看不见的地方，有人正因为你变得更好。',
  '慢慢来没关系，重要的是一直在路上。',
  '当你觉得无人理解时，记得你还有自己。',
  '今天的小步伐，会成就明天的大梦想。',
  '生活偶尔撒野，但你可以选择温柔以对。',
];

/**
 * 渲染一批留言到界面
 * @param {Array<{id:number, body:string}>} list
 */
function renderMessages(list) {
  for (const item of list) {
    const div = document.createElement('div');
    div.className = 'message';
    div.textContent = item.body;
    messagesContainer.appendChild(div);
  }
}

async function loadPage(page) {
  try {
    const list = await window.fetchMessages(page);
    if (list && list.length > 0) {
      renderMessages(list);
    } else {
      // 如果 GitHub 返回空列表，使用本地示例
      const start = (page - 1) * 5;
      const fallback = sampleMessages.slice(start, start + 5).map((text, idx) => ({ id: start + idx, body: text }));
      renderMessages(fallback);
    }
  } catch (error) {
    // 离线或网络错误时使用本地示例
    const start = (page - 1) * 5;
    const fallback = sampleMessages.slice(start, start + 5).map((text, idx) => ({ id: start + idx, body: text }));
    renderMessages(fallback);
  }
}

// 初始加载
loadPage(currentPage);

loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  loadPage(currentPage);
});