const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Low-level request helper. Attaches the bearer token (if present) and
 * normalizes FastAPI's { detail: ... } error shape into a thrown ApiError.
 */
async function request(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = data?.detail || `Request failed with status ${response.status}`;
    throw new ApiError(typeof message === 'string' ? message : JSON.stringify(message), response.status);
  }

  return data;
}

export const authApi = {
  loginAdmin: (password) => request('/api/auth/login', { method: 'POST', body: { password } }),
  loginCandidate: (candidateId, password) =>
    request('/api/auth/login', { method: 'POST', body: { password, candidateId } }),
};

export const candidatesApi = {
  list: () => request('/api/candidates'),
  get: (candidateId) => request(`/api/candidates/${candidateId}`),
};

export const interviewApi = {
  start: (sessionId, token) =>
    request('/api/interview/start', { method: 'POST', body: { sessionId }, token }),
  turn: (sessionId, message, token) =>
    request('/api/interview/turn', { method: 'POST', body: { sessionId, message }, token }),
  audio: (sessionId, audioBlob, token) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio_file', audioBlob, 'candidate_response.webm');
    return request('/api/interview/audio', { method: 'POST', body: formData, token, isForm: true });
  },
};

export const reportsApi = {
  forCandidate: (candidateId, token) => request(`/api/candidates/${candidateId}/reports`, { token }),
};

export const adminApi = {
  overview: (token) => request('/api/admin/overview', { token }),
  candidates: (token) => request('/api/admin/candidates', { token }),
  allReports: (token) => request('/api/admin/reports', { token }),
  reportsForCandidate: (candidateId, token) => request(`/api/admin/reports/${candidateId}`, { token }),
};

export { ApiError };
