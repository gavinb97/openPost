// ============================================================
// API Client — Fetch wrapper with JWT auth
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v2';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  token?: string;
}

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Get token from localStorage if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || res.statusText, res.status, data);
  }

  if (res.status === 204) return null as T;
  const json = await res.json();
  // Unwrap API envelope { ok, data } if present
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T = any>(url: string, opts?: ApiOptions) => request<T>(url, { ...opts, method: 'GET' }),
  post: <T = any>(url: string, body?: any, opts?: ApiOptions) => request<T>(url, { ...opts, method: 'POST', body }),
  put: <T = any>(url: string, body?: any, opts?: ApiOptions) => request<T>(url, { ...opts, method: 'PUT', body }),
  patch: <T = any>(url: string, body?: any, opts?: ApiOptions) => request<T>(url, { ...opts, method: 'PATCH', body }),
  delete: <T = any>(url: string, opts?: ApiOptions) => request<T>(url, { ...opts, method: 'DELETE' }),
};

// Typed API methods
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<{ token: string; user: any }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: any }>('/auth/login', data),
  me: () => api.get<any>('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  updatePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/auth/password', data),
};

export const agentApi = {
  list: () => api.get<{ agents: any[] }>('/agents'),
  get: (id: string) => api.get<{ agent: any }>(`/agents/${id}`),
  create: (data: any) => api.post<{ agent: any }>('/agents', data),
  update: (id: string, data: any) => api.put<{ agent: any }>(`/agents/${id}`, data),
  toggle: (id: string) => api.post<{ agent: any }>(`/agents/${id}/toggle`),
  delete: (id: string) => api.delete(`/agents/${id}`),
  actions: (id: string, page = 1) => api.get<{ actions: any[]; total: number }>(`/agents/${id}/actions?page=${page}`),
  conversations: (id: string) => api.get<{ conversations: any[] }>(`/agents/${id}/conversations`),
};

export const jobApi = {
  list: (params?: { status?: string; platform?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<{ jobs: any[] }>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<{ job: any }>(`/jobs/${id}`),
  create: (data: any) => api.post<{ job: any }>('/jobs', data),
  pause: (id: string) => api.post(`/jobs/${id}/pause`),
  resume: (id: string) => api.post(`/jobs/${id}/resume`),
  cancel: (id: string) => api.post(`/jobs/${id}/cancel`),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  executions: (id: string, page = 1) =>
    api.get<{ executions: any[]; total: number }>(`/jobs/${id}/executions?page=${page}`),
};

export const mediaApi = {
  getUploadUrl: (data: { filename: string; content_type: string; category?: string }) =>
    api.post<{ upload_url: string; key: string; media_id: string }>('/media/upload-url', data),
  register: (data: { media_id: string; original_filename: string; content_type: string; file_size: number; category?: string }) =>
    api.post<{ media: any }>('/media/register', data),
  list: (params?: { page?: number; category?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<{ media: any[]; total: number }>(`/media${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<{ media: any }>(`/media/${id}`),
  delete: (id: string) => api.delete(`/media/${id}`),
};

export const reviewApi = {
  queue: (page = 1) => api.get<{ actions: any[]; total: number }>(`/review?page=${page}`),
  review: (id: string, data: { action: 'approve' | 'reject'; edited_content?: string }) =>
    api.post<{ action: any }>(`/review/${id}`, data),
  bulkReview: (data: { action_ids: string[]; action: 'approve' | 'reject' }) =>
    api.post('/review/bulk', data),
};

export const metricsApi = {
  overview: () => api.get<any>('/metrics/overview'),
  timeline: (days = 30) => api.get<{ timeline: any[] }>(`/metrics/timeline?days=${days}`),
  leaderboard: () => api.get<{ leaderboard: any[] }>('/metrics/agents'),
};

export const oauthApi = {
  accounts: () => api.get<{ accounts: any[] }>('/oauth/accounts'),
  disconnect: (id: string) => api.delete(`/oauth/accounts/${id}`),
  refreshToken: (id: string) => api.post(`/oauth/refresh/${id}`),
  start: (platform: string) => api.get<{ url: string }>(`/oauth/${platform}/start`),
};

export const contentApi = {
  generate: (data: any) => api.post<{ content: any }>('/content/generate', data),
  preview: (data: any) => api.post<{ preview: any }>('/content/preview', data),
  templates: () => api.get<{ templates: any[] }>('/content/templates'),
  createTemplate: (data: any) => api.post<{ template: any }>('/content/templates', data),
  updateTemplate: (id: string, data: any) => api.put<{ template: any }>(`/content/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/content/templates/${id}`),
  // Viral tools
  hooks: (data: { topic: string; platform?: string; count?: number; style?: string }) =>
    api.post<{ hooks: string[] }>('/content/hooks', data),
  hashtags: (data: { topic: string; platform?: string; count?: number; niche?: string }) =>
    api.post<{ hashtags: string[]; trending: string[]; niche: string[] }>('/content/hashtags', data),
  buildThread: (data: { topic?: string; base_content?: string; tweet_count?: number; personality?: string; include_cta?: string }) =>
    api.post<{ tweets: string[]; tweet_count: number; total_chars: number }>('/content/thread', data),
  viralScore: (data: { content: string; platform?: string }) =>
    api.post<{ score: number; hook_strength: number; weaknesses: string[]; improvements: string[]; rewrite?: string }>('/content/viral-score', data),
  bestTimes: (platform: string) =>
    api.get<{ times: string[]; note: string }>(`/content/best-times?platform=${platform}`),
};

export const campaignApi = {
  list: (params?: { page?: number; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<{ campaigns: any[]; total: number }>(`/campaigns${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<{ campaign: any; posts: any[] }>(`/campaigns/${id}`),
  create: (data: any) => api.post<{ campaign: any }>('/campaigns', data),
  update: (id: string, data: any) => api.put<{ campaign: any }>(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
  resume: (id: string) => api.post(`/campaigns/${id}/resume`),
  launch: (id: string) => api.post<{ queued: number }>(`/campaigns/${id}/launch`),
  adapt: (id: string, data: { platform: string; platform_post_id?: string }) =>
    api.post<{ adapted_content: string; char_count: number; char_limit: number }>(`/campaigns/${id}/adapt`, data),
  adaptAll: (id: string) =>
    api.post<{ adaptations: Record<string, string> }>(`/campaigns/${id}/adapt-all`),
  updatePost: (campaignId: string, postId: string, data: any) =>
    api.put<{ post: any }>(`/campaigns/${campaignId}/posts/${postId}`, data),
  // Calendar
  calendar: (params?: { start?: string; end?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<{ events: any[]; total: number }>(`/campaigns/calendar/upcoming${qs ? `?${qs}` : ''}`);
  },
  schedulePost: (data: any) => api.post<{ post: any }>('/campaigns/calendar/post', data),
  deleteScheduledPost: (id: string) => api.delete(`/campaigns/calendar/post/${id}`),
};

export const billingApi = {
  checkout: () => api.post<{ url: string }>('/billing/checkout'),
  portal: () => api.post<{ url: string }>('/billing/portal'),
  status: () => api.get<{ subscription: any }>('/billing/status'),
};

export { ApiError };
