import { TotvsLoginRequest, TotvsRefreshRequest, TotvsTokenResponse } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

// Default fallback endpoint - should be overridden by configuration
const DEFAULT_ENDPOINT = "http://erp-simpleit.sytes.net:8051";
const TOKEN_ENDPOINT = "/api/connect/token";

export interface StoredToken extends TotvsTokenResponse {
  timestamp: number;
  username: string;
  endpoint: string;
  expires_at?: string;
}

export class AuthenticationError extends Error {
  public readonly technicalDetails: string;

  constructor(friendlyMessage: string, technicalDetails: string) {
    super(friendlyMessage);
    this.name = "AuthenticationError";
    this.technicalDetails = technicalDetails;
  }
}

export class AuthService {
  private static readonly TOKEN_KEY = "totvs_token";

  static async authenticate(credentials: TotvsLoginRequest & { endpoint: string }): Promise<TotvsTokenResponse> {
    const { endpoint, ...requestData } = credentials;
    const fullUrl = `${endpoint}${TOKEN_ENDPOINT}`;
    
    console.log("🔗 Tentando autenticar em:", fullUrl);
    console.log("📤 Dados da requisição:", requestData);
    
    try {
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      console.log("📥 Resposta recebida - Status:", response.status);
      return await this.handleAuthResponse(response, fullUrl);
      
    } catch (error) {
      console.error("❌ Erro na requisição:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const friendlyMessage = "Não foi possível conectar ao servidor TOTVS. Verifique se o endpoint está correto e acessível.";
        const technicalDetails = `Falha na conexão com ${fullUrl}: ${error.message}`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      }
      
      throw error;
    }
  }

  private static async handleAuthResponse(response: Response, fullUrl: string): Promise<TotvsTokenResponse> {

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("⚠️ Erro na resposta:", { status: response.status, errorData });
      
      if (response.status === 401) {
        const friendlyMessage = "Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.";
        const technicalDetails = `HTTP ${response.status}: ${(errorData as any).error_description || response.statusText}`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      } else if (response.status === 400) {
        const friendlyMessage = "Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.";
        const technicalDetails = `HTTP ${response.status}: ${(errorData as any).error_description || response.statusText}`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      } else if (response.status === 404) {
        const friendlyMessage = "Servidor não encontrado. Verifique a conexão com o TOTVS RM.";
        const technicalDetails = `HTTP ${response.status}: Endpoint ${fullUrl} não encontrado`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      } else if (response.status >= 500) {
        const friendlyMessage = "Erro no servidor TOTVS. Tente novamente em alguns minutos.";
        const technicalDetails = `HTTP ${response.status}: ${(errorData as any).error_description || response.statusText}`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      } else {
        const friendlyMessage = "Erro inesperado durante a autenticação. Tente novamente.";
        const technicalDetails = `HTTP ${response.status}: ${(errorData as any).error_description || response.statusText}`;
        throw new AuthenticationError(friendlyMessage, technicalDetails);
      }
    }

    const tokenData = await response.json();
    console.log("✅ Autenticação bem-sucedida");
    return tokenData;
  }

  /**
   * Renova o token usando o refresh_token
   * @param refreshTokenValue O valor do refresh_token
   * @returns O novo token renovado
   */
  static async refreshToken(refreshTokenValue: string): Promise<StoredToken> {
    console.log("Iniciando renovação de token...");
    
    const currentToken = this.getStoredToken();
    if (!currentToken) {
      console.error("Token atual não encontrado");
      throw new Error("Token atual não encontrado");
    }

    // Verificar se o refresh_token é válido
    if (!refreshTokenValue || refreshTokenValue.trim() === "") {
      console.error("Refresh token inválido ou vazio");
      throw new Error("Refresh token inválido ou vazio");
    }
    
    const refreshRequest: TotvsRefreshRequest = {
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    };
    
    // Log do refresh token (parcial) para debug
    console.log("Refresh token (primeiros 10 caracteres):", 
      refreshTokenValue.substring(0, 10) + "...");
    console.log("Refresh token (últimos 10 caracteres):", 
      "..." + refreshTokenValue.substring(refreshTokenValue.length - 10));
    console.log("Tamanho do refresh token:", refreshTokenValue.length);

    try {
      // Verificar se o endpoint está correto
      if (!currentToken.endpoint) {
        throw new Error("Endpoint não definido no token atual");
      }
      
      const tokenUrl = `${currentToken.endpoint}${TOKEN_ENDPOINT}`;
      console.log(`Enviando requisição para ${tokenUrl}`);
      
      // Log dos dados enviados para debug
      const requestBody = JSON.stringify(refreshRequest);
      console.log("Dados da requisição:", {
        url: tokenUrl,
        headers: { "Content-Type": "application/json" },
        body: refreshRequest,
        bodyString: requestBody
      });
      
      // Importante: Usar o mesmo formato que o método authenticate (application/json)
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refreshRequest),
      });

      // Log da resposta para debug
      console.log(`Resposta recebida com status: ${response.status}`);
      
      if (!response.ok) {
        // Tentar obter detalhes do erro
        let errorData = {};
        try {
          errorData = await response.json();
          console.error("Dados do erro:", errorData);
        } catch (e) {
          console.error("Não foi possível obter detalhes do erro:", e);
        }
        
        const errorMessage = (errorData as any).error_description || `Erro ao renovar token: ${response.status}`;
        console.error("Resposta de erro:", errorMessage);
        throw new Error(errorMessage);
      }

      // Tentar obter os dados do novo token
      let newTokenData;
      try {
        newTokenData = await response.json();
        console.log("Dados do novo token recebidos:", { 
          access_token: newTokenData.access_token ? "[presente]" : "[ausente]",
          expires_in: newTokenData.expires_in,
          token_type: newTokenData.token_type
        });
      } catch (e) {
        console.error("Erro ao processar resposta do token:", e);
        throw new Error("Erro ao processar resposta do servidor");
      }
      console.log("Token renovado com sucesso");
      
      // Verificar se o token retornado é válido
      if (!newTokenData.access_token) {
        console.error("Token renovado inválido: access_token ausente", newTokenData);
        throw new Error("O servidor retornou um token inválido (access_token ausente)");
      }
      
      if (!newTokenData.expires_in) {
        console.warn("Token renovado sem expires_in, usando valor padrão de 1 hora");
        newTokenData.expires_in = 3600; // 1 hora como padrão
      }
      
      // Criar o novo token armazenado
      const timestamp = Date.now();
      const expires_at = new Date(timestamp + newTokenData.expires_in * 1000).toISOString();
      
      const newStoredToken: StoredToken = {
        ...newTokenData,
        timestamp,
        username: currentToken.username,
        endpoint: currentToken.endpoint,
        expires_at,
      };
      
      // Verificar se o novo token tem todos os campos necessários
      if (!newStoredToken.username || !newStoredToken.endpoint) {
        console.error("Novo token sem username ou endpoint");
        throw new Error("Erro ao criar novo token: dados incompletos");
      }
      
      console.log(`Novo token criado, expira em: ${expires_at}`);
      return newStoredToken;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      throw error;
    }
  }

  static async refreshTokenLegacy(refreshTokenRequest: TotvsRefreshRequest, endpoint: string): Promise<TotvsTokenResponse> {
    const response = await fetch(`${endpoint}${TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshTokenRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error_description || `Erro ao renovar token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Armazena o token no localStorage
   * @param tokenData O token a ser armazenado
   * @param username O nome de usuário (opcional se tokenData for StoredToken)
   * @param endpoint O endpoint da API (opcional se tokenData for StoredToken)
   */
  /**
   * Armazena o token no localStorage
   * @param tokenData O token a ser armazenado
   * @param username O nome de usuário (opcional se tokenData for StoredToken)
   * @param endpoint O endpoint da API (opcional se tokenData for StoredToken)
   */
  static storeToken(tokenData: TotvsTokenResponse | StoredToken, username?: string, endpoint?: string): void {
    try {
      if (!tokenData) {
        console.error("Tentativa de armazenar token nulo");
        return;
      }
      
      // Se tokenData já for um StoredToken, preservamos seus valores de username e endpoint
      const isStoredToken = 'username' in tokenData && 'endpoint' in tokenData;
      
      // Verificar se temos expires_in para calcular expires_at
      if (!tokenData.expires_in) {
        console.warn("Token sem expires_in, usando valor padrão de 1 hora");
        tokenData.expires_in = 3600; // 1 hora como padrão
      }
      
      const timestamp = Date.now();
      const expires_at = new Date(timestamp + tokenData.expires_in * 1000).toISOString();
      
      const storedToken: StoredToken = {
        ...tokenData,
        timestamp,
        username: isStoredToken ? (tokenData as StoredToken).username : (username as string),
        endpoint: isStoredToken ? (tokenData as StoredToken).endpoint : (endpoint as string),
        expires_at,
      };
      
      // Verificar se o token tem todos os campos necessários
      if (!storedToken.access_token) {
        console.error("Tentativa de armazenar token sem access_token");
        return;
      }
      
      if (!storedToken.username || !storedToken.endpoint) {
        console.error("Tentativa de armazenar token sem username ou endpoint");
        return;
      }
      
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(storedToken));
      console.log("Token armazenado com sucesso:", {
        username: storedToken.username,
        expires_at: storedToken.expires_at,
        token_type: storedToken.token_type
      });
    } catch (error) {
      console.error("Erro ao armazenar token:", error);
    }
  }

  /**
   * Obtém o token armazenado no localStorage
   * @returns O token armazenado ou null se não existir
   */
  static getStoredToken(): StoredToken | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return null;
      
      const parsedToken = JSON.parse(stored) as StoredToken;
      
      // Verificar se o token tem todos os campos necessários
      if (!parsedToken.access_token || !parsedToken.username || !parsedToken.endpoint) {
        console.warn("Token armazenado está incompleto");
        return null;
      }
      
      return parsedToken;
    } catch (error) {
      console.error("Erro ao obter token armazenado:", error);
      // Em caso de erro, limpar o token para evitar problemas futuros
      this.clearToken();
      return null;
    }
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Verifica se um token é válido
   * @param token O token a ser verificado
   * @returns true se o token for válido, false caso contrário
   */
  static isTokenValid(token: StoredToken): boolean {
    try {
      if (!token || !token.access_token) return false;
      
      // Se temos expires_at, usamos ele para verificar
      if (token.expires_at) {
        const expiresAtTime = new Date(token.expires_at).getTime();
        const now = Date.now();
        const isValid = expiresAtTime > now;
        
        // Log para debug
        const timeLeft = Math.floor((expiresAtTime - now) / 1000);
        console.log(`Token válido: ${isValid}, tempo restante: ${timeLeft}s`);
        
        return isValid;
      }
      
      // Caso contrário, calculamos com base no timestamp e expires_in
      if (!token.timestamp || !token.expires_in) return false;
      
      const expirationTime = token.timestamp + token.expires_in * 1000;
      const now = Date.now();
      const isValid = expirationTime > now;
      
      // Log para debug
      const timeLeft = Math.floor((expirationTime - now) / 1000);
      console.log(`Token válido: ${isValid}, tempo restante: ${timeLeft}s`);
      
      return isValid;
    } catch (error) {
      console.error("Erro ao verificar validade do token:", error);
      return false;
    }
  }
  
  /**
   * Verifica se um token está expirado
   * @param token O token a ser verificado
   * @returns true se o token estiver expirado, false caso contrário
   */
  static isTokenExpired(token: StoredToken): boolean {
    return !this.isTokenValid(token);
  }
  
  /**
   * Renova o token e exibe mensagens de toast
   * @param setIsRefreshing Função para atualizar o estado de carregamento (opcional)
   * @returns O novo token ou null em caso de erro
   */
  static async renewTokenWithToast(setIsRefreshing?: (isRefreshing: boolean) => void): Promise<StoredToken | null> {
    try {
      console.log("Iniciando renovação de token com toast...");
      if (setIsRefreshing) {
        setIsRefreshing(true);
      }

      // Verificar se existe um token armazenado
      const token = this.getStoredToken();
      if (!token) {
        console.error("Não foi possível renovar o token: token não encontrado");
        toast({
          title: "Erro",
          description: "Não foi possível renovar o token, faça o login novamente.",
          variant: "destructive",
        });
        return null;
      }

      // Verificar se o token tem refresh_token
      if (!token.refresh_token || token.refresh_token.trim() === "") {
        console.error("Não foi possível renovar o token: refresh_token não encontrado ou vazio");
        console.log("Token atual:", {
          access_token: token.access_token ? "[presente]" : "[ausente]",
          refresh_token: token.refresh_token ? "[presente]" : "[ausente]",
          username: token.username,
          endpoint: token.endpoint
        });
        toast({
          title: "Erro",
          description: "Não foi possível renovar o token, faça o login novamente.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Refresh token encontrado no localStorage:", {
        tamanho: token.refresh_token.length,
        primeiros10: token.refresh_token.substring(0, 10) + "...",
        ultimos10: "..." + token.refresh_token.substring(token.refresh_token.length - 10)
      });
      
      // Verificar se o token tem endpoint
      if (!token.endpoint || token.endpoint.trim() === "") {
        console.error("Não foi possível renovar o token: endpoint não encontrado ou vazio");
        toast({
          title: "Erro",
          description: "Não foi possível renovar o token, faça o login novamente.",
          variant: "destructive",
        });
        return null;
      }

      console.log("Chamando refreshToken...");
      // Renovar o token
      const newToken = await this.refreshToken(token.refresh_token);
      
      if (!newToken || !newToken.access_token) {
        throw new Error("Falha ao renovar token: token inválido retornado");
      }
      
      console.log("Token renovado com sucesso, armazenando...");
      // Armazenar o token renovado no localStorage para sincronização global
      this.storeToken(newToken);
      
      toast({
        title: "Token renovado",
        description: "Seu token foi renovado com sucesso",
      });
      
      return newToken;
    } catch (error: any) {
      console.error("Erro ao renovar token:", error);
      
      // Exibir mensagem de erro mais específica se disponível
      const errorMessage = error.message || "Não foi possível renovar o token. Faça login novamente.";
      
      toast({
        title: "Erro ao renovar token",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      if (setIsRefreshing) {
        setIsRefreshing(false);
      }
    }
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
