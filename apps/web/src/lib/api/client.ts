import { AuthTokens } from '@dhanam/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private accessToken?: string;
  private refreshToken?: string;
  private onTokenRefresh?: (tokens: AuthTokens) => void;

  constructor(config: { baseUrl?: string; onTokenRefresh?: (tokens: AuthTokens) => void }) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    this.onTokenRefresh = config.onTokenRefresh;
  }

  setTokens(tokens: { accessToken: string; refreshToken: string }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  clearTokens() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          data.error?.details
        );
      }

      return data.data || data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 && this.refreshToken) {
          try {
            const tokens = await this.refreshTokens();
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            this.onTokenRefresh?.(tokens);

            return this.request<T>(path, options);
          } catch (refreshError) {
            this.clearTokens();
            throw refreshError;
          }
        }
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', 'Network error occurred');
    }
  }

  private async refreshTokens(): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'REFRESH_FAILED', 'Failed to refresh token');
    }

    const data = await response.json();
    return data.data.tokens;
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${path}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }
}

// Create the client with token refresh callback
export const apiClient = new ApiClient({
  onTokenRefresh: (tokens) => {
    // Import auth store dynamically to avoid circular dependency
    import('../hooks/use-auth').then(({ useAuth }) => {
      const store = useAuth.getState();
      if (store.user) {
        store.setAuth(store.user, tokens);
      }
    });
  },
});
