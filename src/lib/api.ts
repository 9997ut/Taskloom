const API_BASE = '/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}


interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
}

export class ApiResponseError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(status: number, message: string, code?: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) return false;

    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (accessToken) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  let res = await fetch(`${API_BASE}${endpoint}`, config);

  // silent refresh on 401 with TOKEN_EXPIRED
  if (res.status === 401) {
    const errorData = await res.json().catch(() => null);
    if (errorData?.error?.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // retry the original request with new token
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(`${API_BASE}${endpoint}`, config);
      }
    } else {
      throw new ApiResponseError(
        res.status,
        errorData?.error?.message || 'Authentication required',
        errorData?.error?.code,
        errorData?.error?.fields
      );
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const errorData: ApiError = await res.json().catch(() => ({
      error: { message: 'An unexpected error occurred' },
    }));

    throw new ApiResponseError(
      res.status,
      errorData.error.message,
      errorData.error.code,
      errorData.error.fields,
    );
  }

  return res.json();
}
