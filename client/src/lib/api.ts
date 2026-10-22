import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const DOCS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '') + '/api/docs';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hireflow_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('hireflow_token');
        localStorage.removeItem('hireflow_user');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Downloads a candidate resume securely using the authenticated API client
 */
export const downloadResumeFile = async (
  resumeUrlOrFilename: string,
  candidateName?: string
): Promise<void> => {
  if (!resumeUrlOrFilename) {
    throw new Error('No resume document attached to this profile');
  }
  const filename = resumeUrlOrFilename.split('/').pop()?.split('?')[0];
  if (!filename) {
    throw new Error('Invalid resume document filename');
  }

  const res = await api.get(`/resumes/${filename}`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], {
    type: String(res.headers['content-type'] || 'application/pdf'),
  });
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  const downloadFileName = candidateName
    ? `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`
    : filename;
  link.setAttribute('download', downloadFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
};

/**
 * Generates an authenticated URL for opening a resume in a new tab
 */
export const getAuthenticatedResumeUrl = (resumeUrlOrFilename: string): string => {
  if (!resumeUrlOrFilename) return '';
  const filename = resumeUrlOrFilename.split('/').pop()?.split('?')[0];
  if (!filename) return '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('hireflow_token') : null;
  const baseUrl = `${API_URL}/resumes/${filename}`;
  if (token) {
    return `${baseUrl}?token=${encodeURIComponent(token)}&view=inline`;
  }
  return baseUrl;
};

