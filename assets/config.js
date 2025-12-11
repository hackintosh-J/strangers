const CONFIG = {
  // 生产环境 (绑定域名后):
  // 我们将配置 Worker 路由到 https://hackins.club/api/*
  // 所以这里填写根域名，或者即使留空(使用相对路径)也可以
  apiUrl: 'https://hackins.club',

  // 如果您在本地开发，或者域名还未生效，
  // 可以临时改为您的 workers.dev 地址 (但在国内需翻墙)
  // apiUrl: 'https://strangers-backend.YOUR_SUBDOMAIN.workers.dev'
};

// 防止修改
Object.freeze(CONFIG);
