const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface ShortUrl {
  id: string;
  code: string;
  originalUrl: string;
  createdAt: string;
  updatedAt: string;
  _count?: { clicks: number };
}

export interface AnalyticsDetail {
  code: string;
  originalUrl: string;
  createdAt: string;
  totalClicks: number;
  recentClicks: { id: string; clickedAt: string; ipAddress?: string }[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  listUrls: () =>
    request<{ source: string; data: ShortUrl[] }>("/api/urls"),

  createUrl: (originalUrl: string, customCode?: string) =>
    request<ShortUrl>("/api/urls", {
      method: "POST",
      body: JSON.stringify({ originalUrl, customCode: customCode || undefined }),
    }),

  updateUrl: (code: string, originalUrl: string) =>
    request<ShortUrl>(`/api/urls/${code}`, {
      method: "PUT",
      body: JSON.stringify({ originalUrl }),
    }),

  deleteUrl: (code: string) =>
    request<void>(`/api/urls/${code}`, { method: "DELETE" }),

  getAnalytics: (code: string) =>
    request<AnalyticsDetail>(`/api/urls/${code}/analytics`),
};

export { API_BASE_URL };
