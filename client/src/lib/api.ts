import axios from 'axios';

/**
 * Normalizes an API URL to guarantee it starts with a protocol and ends with exactly '/api',
 * without double slashes, trailing slashes, or duplicate '/api/api' segments.
 */
export const normalizeApiUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim().replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return '';

  // Ensure protocol is present
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
      trimmed = `http://${trimmed}`;
    } else {
      trimmed = `https://${trimmed}`;
    }
  }

  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');

  // Normalize /api suffix: guarantee exactly one trailing /api
  if (/\/api$/i.test(trimmed)) {
    trimmed = trimmed.replace(/(\/api)+$/i, '/api');
  } else {
    trimmed = `${trimmed}/api`;
  }

  return trimmed;
};

/**
 * Checks whether a URL contains obvious placeholder strings that will fail DNS resolution.
 */
export const isPlaceholderUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('your-backend-name') ||
    lower.includes('your-backend') ||
    lower.includes('your-api') ||
    lower.includes('your-app') ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('<') ||
    lower.includes('>')
  );
};

/**
 * Resolves the central API base URL.
 * - Prioritizes NEXT_PUBLIC_API_URL (and supported aliases).
 * - Normalizes the URL so that '/api' is appended exactly once.
 * - Guards against placeholder URLs that cause ERR_NAME_NOT_RESOLVED.
 * - In local development / test, falls back safely to 'http://localhost:5001/api'.
 * - In production (or live browser environments), throws an explicit configuration error
 *   if NEXT_PUBLIC_API_URL is missing or placeholder, preventing silent fallbacks to localhost.
 */
export const getApiBaseUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_URL;

  const isBrowser = typeof window !== 'undefined';
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const isLocalHost =
    isBrowser &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname.endsWith('.local'));

  if (envUrl && envUrl.trim().length > 0) {
    // 1. Guard against localhost in live production browser deployments
    if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      if (!isDev && isBrowser && !isLocalHost) {
        const localhostError =
          `HireFlow Configuration Error: NEXT_PUBLIC_API_URL is configured as "${envUrl}". ` +
          `In production (on ${window.location.hostname}), requests to localhost fail with net::ERR_CONNECTION_REFUSED ` +
          `because localhost refers to the visitor's local computer. ` +
          `Please set NEXT_PUBLIC_API_URL in your Vercel Project Settings to your deployed Render backend URL ` +
          `(e.g., https://dphireflow.onrender.com/api) and redeploy.`;

        console.error(`[HireFlow] ${localhostError}`);
        throw new Error(localhostError);
      }
    }

    // 2. Guard against placeholder hostnames that cause ERR_NAME_NOT_RESOLVED
    if (isPlaceholderUrl(envUrl)) {
      if (isDev || isLocalHost) {
        return 'http://localhost:5001/api';
      }
      const placeholderError =
        `HireFlow Configuration Error: NEXT_PUBLIC_API_URL contains placeholder value "${envUrl}". ` +
        `This hostname does not exist in DNS and causes ERR_NAME_NOT_RESOLVED in the browser. ` +
        `Please copy your actual backend service URL from your Render Dashboard (e.g., https://dphireflow.onrender.com/api) ` +
        `and set it as NEXT_PUBLIC_API_URL in your Vercel Project Settings -> Environment Variables, then trigger a redeploy.`;

      if (isBrowser) {
        console.error(`[HireFlow] ${placeholderError}`);
      }
      throw new Error(placeholderError);
    }
    return normalizeApiUrl(envUrl);
  }

  // Development/Localhost safe fallback
  if (isDev || isLocalHost) {
    return 'http://localhost:5001/api';
  }

  // Production environment configuration guard
  const errorMsg =
    'HireFlow Configuration Error: NEXT_PUBLIC_API_URL is not set in production. ' +
    'The production frontend cannot reach the backend server. ' +
    'Please configure NEXT_PUBLIC_API_URL in your hosting platform (e.g. Vercel Project Settings -> Environment Variables) ' +
    'with your deployed Render backend URL (e.g., https://dphireflow.onrender.com/api) and redeploy.';

  if (isBrowser) {
    console.error(`[HireFlow] ${errorMsg}`);
  }
  throw new Error(errorMsg);
};

// Evaluated base URL (safe fallback for build-time static page collection)
export const API_URL = (() => {
  try {
    return getApiBaseUrl();
  } catch {
    return '';
  }
})();

export const getDocsUrl = (): string => {
  try {
    return getApiBaseUrl().replace(/\/api\/?$/, '') + '/api/docs';
  } catch {
    return '/api/docs';
  }
};

export const DOCS_URL = getDocsUrl();

export const api = axios.create({
  baseURL: API_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: guarantees dynamic base URL resolution and attaches JWT token
api.interceptors.request.use(
  (config) => {
    // Dynamically re-evaluate base URL on every request to prevent stale or unconfigured endpoints
    try {
      config.baseURL = getApiBaseUrl();
    } catch (err: any) {
      return Promise.reject(err);
    }

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

// Response interceptor for centralized error message extraction and diagnostics
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('hireflow_token');
        localStorage.removeItem('hireflow_user');
      }
    }

    // Enhance network/DNS/CORS failures with helpful instructions
    if (!error.response) {
      let targetUrl = '';
      try {
        targetUrl = getApiBaseUrl();
      } catch {
        // Handled if getApiBaseUrl threw
      }

      const isNetwork =
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        !error.status;

      if (isNetwork && targetUrl) {
        error.message =
          `Cannot reach HireFlow backend API at "${targetUrl}". ` +
          `Possible causes: 1) Render backend is spinning up or offline, ` +
          `2) Hostname DNS error (verify NEXT_PUBLIC_API_URL in Vercel), ` +
          `3) Render CORS origin blocked this domain (verify CORS_ORIGIN on Render).`;
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
  const baseUrl = `${getApiBaseUrl()}/resumes/${filename}`;
  if (token) {
    return `${baseUrl}?token=${encodeURIComponent(token)}&view=inline`;
  }
  return baseUrl;
};
