const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw json.error || { code: 'UNKNOWN_ERROR', message: '请求失败' };
  }

  return json.data;
}

export const api = {
  get: (path, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(path + query);
  },

  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),

  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),

  del: (path) =>
    request(path, { method: 'DELETE' }),
};
