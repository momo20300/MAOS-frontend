/**
 * MAOS Authentication Service
 * Handles all authentication-related API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  currentTenant?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthTokens & { user?: AuthUser };
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'maos_access_token';
const REFRESH_TOKEN_KEY = 'maos_refresh_token';
const USER_KEY = 'maos_user';

/**
 * Store tokens in localStorage and sync to cookies for middleware
 */
export function storeTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    // Sync to cookies for middleware auth check
    document.cookie = `maos_access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax`;
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Get user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear all auth data from localStorage and cookies
 */
export function clearAuthData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear the cookie for middleware
    document.cookie = 'maos_access_token=; path=/; max-age=0; SameSite=Lax';
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur de connexion');
  }

  // Store tokens and user
  if (data.data) {
    storeTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresIn: data.data.expiresIn,
    });
    if (data.data.user) {
      storeUser(data.data.user);
    }
  }

  return data;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Erreur d\'inscription');
  }

  // Store tokens
  if (result.data) {
    storeTokens({
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      expiresIn: result.data.expiresIn,
    });
  }

  return result;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore errors on logout
    }
  }

  clearAuthData();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const data = await response.json();

    if (data.data) {
      storeTokens(data.data);
      return data.data;
    }

    return null;
  } catch {
    clearAuthData();
    return null;
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(retries = 1): Promise<AuthUser | null> {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 && retries > 0) {
        // Try to refresh token
        const newTokens = await refreshAccessToken();
        if (newTokens) {
          return getCurrentUser(retries - 1);
        }
        clearAuthData();
      }
      return null;
    }

    const data = await response.json();

    if (data.data) {
      storeUser(data.data);
      return data.data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Switch tenant
 */
export async function switchTenant(tenantId: string): Promise<AuthTokens | null> {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/switch-tenant/${tenantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.data) {
      storeTokens(data.data);
      return data.data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  if (!token) {
    throw new Error('Non authentifié');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  let response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const newTokens = await refreshAccessToken();

    if (newTokens) {
      token = newTokens.accessToken;
      response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    } else {
      throw new Error('Session expirée');
    }
  }

  return response;
}
