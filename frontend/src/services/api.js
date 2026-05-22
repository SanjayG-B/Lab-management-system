const getHeaders = () => {
  const token = localStorage.getItem('aura_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (url) => {
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  },
  post: async (url, data, isMultipart = false) => {
    const headers = getHeaders();
    if (isMultipart) {
      delete headers['Content-Type']; // Let browser set bounds
    }
    const body = isMultipart ? data : JSON.stringify(data);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body
    });
    return await res.json();
  },
  put: async (url, data) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  delete: async (url) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },
  patch: async (url, data = {}) => {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};
