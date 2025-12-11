const GITHUB_API = 'https://api.github.com';

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    const error = new Error(
      `GitHub API error ${response.status}: ${message || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Fetch paginated issues from a public repository.
 * @param {Object} options
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {number} [options.page=1]
 * @param {number} [options.perPage=10]
 * @param {string} [options.token]
 */
export async function fetchIssues({ owner, repo, page = 1, perPage = 10, token }) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: buildHeaders(token),
    cache: 'no-store',
  });

  const data = await handleResponse(response);
  return data.filter((item) => !item.pull_request);
}

/**
 * Fetch paginated discussions from a public repository.
 * @param {Object} options
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {number} [options.page=1]
 * @param {number} [options.perPage=10]
 * @param {string} [options.token]
 */
export async function fetchDiscussions({
  owner,
  repo,
  page = 1,
  perPage = 10,
  token,
}) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/discussions?page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: {
      ...buildHeaders(token),
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });

  return handleResponse(response);
}

/**
 * Combine issues and discussions for a unified feed.
 */
export async function fetchCommunityFeed({
  owner,
  repo,
  page = 1,
  perPage = 10,
  token,
  source = 'issues',
}) {
  if (source === 'discussions') {
    return fetchDiscussions({ owner, repo, page, perPage, token });
  }

  return fetchIssues({ owner, repo, page, perPage, token });
}

export function normalizeCardData(item) {
  const isDiscussion = Boolean(item.category || item.answer_html_url);
  const labels = isDiscussion
    ? item.labels?.map((label) => label.name) || []
    : item.labels?.map((label) => label.name) || [];

  return {
    id: item.id,
    title: item.title || '来自社区的温暖留言',
    author: item.user?.login || item.author?.login || '匿名',
    body: item.body || item.body_text || '没有内容，但依然传递温暖。',
    createdAt: item.created_at || item.createdAt,
    labels,
    url: item.html_url,
    type: isDiscussion ? 'discussion' : 'issue',
  };
}
