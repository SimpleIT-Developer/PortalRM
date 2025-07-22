import { TotvsLoginRequest, TotvsRefreshRequest, TotvsTokenResponse } from "@shared/schema";

const TOTVS_API_BASE = "https://legiaoda142256.rm.cloudtotvs.com.br:8051";
const TOKEN_ENDPOINT = "/api/connect/token";

export interface StoredToken extends TotvsTokenResponse {
  timestamp: number;
  username: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = "totvs_token";

  static async authenticate(credentials: TotvsLoginRequest): Promise<TotvsTokenResponse> {
    const response = await fetch(`${TOTVS_API_BASE}${TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error("Usuário ou senha inválidos. Verifique suas credenciais e tente novamente.");
      } else if (response.status === 404) {
        throw new Error("Serviço não encontrado. Verifique o endpoint do servidor.");
      } else if (response.status >= 500) {
        throw new Error("Erro interno do servidor. Tente novamente mais tarde.");
      } else {
        throw new Error(errorData.error_description || `Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return await response.json();
  }

  static async refreshToken(refreshTokenRequest: TotvsRefreshRequest): Promise<TotvsTokenResponse> {
    const response = await fetch(`${TOTVS_API_BASE}${TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshTokenRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || `Erro ao renovar token: ${response.status}`);
    }

    return await response.json();
  }

  static storeToken(tokenData: TotvsTokenResponse, username: string): void {
    const storedToken: StoredToken = {
      ...tokenData,
      timestamp: Date.now(),
      username,
    };
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(storedToken));
  }

  static getStoredToken(): StoredToken | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isTokenValid(token: StoredToken): boolean {
    const now = Date.now();
    const tokenAge = now - token.timestamp;
    const expiryTime = token.expires_in * 1000; // Convert to milliseconds
    return tokenAge < expiryTime;
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error("Token não encontrado");
    }

    if (!this.isTokenValid(token)) {
      throw new Error("Token expirado");
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token.access_token}`,
      },
    });
  }
}
