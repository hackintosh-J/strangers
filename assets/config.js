/**
 * Strangers v2 Configuration
 */
const CONFIG = {
  // 您的 GitHub 用户名（或组织名）
  owner: 'hackintosh-J',
  
  // 您的仓库名称
  repo: 'strangers',
  
  // (可选) GitHub Personal Access Token
  // ⚠️ 警告：请勿将真实的 Token 提交到公开仓库，否则会被 GitHub 自动撤销。
  // 建议仅在本地调试使用，或使用专门的低权限 "Bot 账号" Token。
  // 如果留空，将使用“跳转 GitHub 发布”的模式。
  token: '',
};

// 防止修改
Object.freeze(CONFIG);
