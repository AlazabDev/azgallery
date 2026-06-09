import type { AdminComment, AdminImage, AdminProject } from './types';

async function request<T>(path: string, adminKey: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey, ...(init?.headers ?? {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? 'تعذر إتمام العملية.');
  return payload as T;
}

export const adminApi = {
  listProjects: (key: string) => request<{ projects: AdminProject[] }>('/api/admin/projects', key),
  createProject: (key: string, input: { slug: string; title: string; subtitle?: string; location?: string; description?: string; coverImageUrl: string; isPublic: boolean }) => request<{ project: AdminProject; accessToken: string | null }>('/api/admin/projects', key, { method: 'POST', body: JSON.stringify(input) }),
  setProjectStatus: (key: string, slug: string, status: 'active' | 'archived') => request<{ project: AdminProject }>(`/api/admin/projects/${encodeURIComponent(slug)}/status`, key, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listImages: (key: string, slug: string) => request<{ images: AdminImage[] }>(`/api/admin/projects/${encodeURIComponent(slug)}/images`, key),
  addImage: (key: string, slug: string, input: { title?: string; description?: string; imageUrl: string; thumbnailUrl: string; displayOrder: number }) => request<{ image: AdminImage }>(`/api/admin/projects/${encodeURIComponent(slug)}/images`, key, { method: 'POST', body: JSON.stringify(input) }),
  setImageStatus: (key: string, imageId: string, status: 'active' | 'archived') => request<{ image: AdminImage }>(`/api/admin/images/${encodeURIComponent(imageId)}/status`, key, { method: 'PATCH', body: JSON.stringify({ status }) }),
  setImageOrder: (key: string, imageId: string, displayOrder: number) => request<{ image: AdminImage }>(`/api/admin/images/${encodeURIComponent(imageId)}/order`, key, { method: 'PATCH', body: JSON.stringify({ displayOrder }) }),
  listComments: (key: string, status?: 'open' | 'resolved') => request<{ comments: AdminComment[] }>(`/api/admin/comments${status ? `?status=${status}` : ''}`, key),
  setCommentStatus: (key: string, commentId: string, status: 'open' | 'resolved') => request<{ comment: AdminComment }>(`/api/admin/comments/${encodeURIComponent(commentId)}/status`, key, { method: 'PATCH', body: JSON.stringify({ status }) })
};
