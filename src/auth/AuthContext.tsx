import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const USERS_API_URL = "http://localhost:3001/users";
const STORAGE_USER_KEY = "dp_user";
const STORAGE_TOKEN_KEY = "dp_token";
const STORAGE_TOKEN_EXPIRES_KEY = "dp_token_expires";
const COOKIE_NAME = "dp_session_token";
const COOKIE_MAX_AGE_SECONDS = 60;

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: "admin" | "user";
  rendaMensal: number;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  nome: string;
  email: string;
  password: string;
  rendaMensal: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "1234";

const normalizeMonthlyIncome = (valor: unknown): number => {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero) || numero <= 0) {
    return 0;
  }
  return numero;
};

const mapApiUserToAuthUser = (dados: Record<string, unknown>): AuthUser => ({
  id: typeof dados.id === "number" ? dados.id : Number(dados.id ?? 0),
  nome: typeof dados.nome === "string" ? dados.nome : "",
  email: typeof dados.email === "string" ? dados.email : "",
  role:
    dados.role === "admin" || dados.role === "user" ? dados.role : "user",
  rendaMensal: normalizeMonthlyIncome(
    dados["rendaMensal"] ?? dados["renda-mensal"]
  ),
});

const generateFakeToken = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const setTokenCookie = (value: string) => {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};

const clearTokenCookie = () => {
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
};

const getTokenFromCookie = (): string | null => {
  const fragment = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!fragment) return null;
  return fragment.substring(COOKIE_NAME.length + 1) || null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshSessionExpiration = useCallback((sessionToken: string) => {
    const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
    localStorage.setItem(STORAGE_TOKEN_EXPIRES_KEY, String(expiresAt));
    setTokenCookie(sessionToken);
  }, []);

  const persistSession = useCallback(
    (sessionUser: AuthUser, sessionToken: string) => {
      const usuarioNormalizado: AuthUser = {
        ...sessionUser,
        role: sessionUser.role ?? "user",
        rendaMensal: normalizeMonthlyIncome(sessionUser.rendaMensal),
      };
      setUser(usuarioNormalizado);
      setToken(sessionToken);
      localStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(usuarioNormalizado)
      );
      localStorage.setItem(STORAGE_TOKEN_KEY, sessionToken);
      refreshSessionExpiration(sessionToken);
    },
    [refreshSessionExpiration]
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_TOKEN_EXPIRES_KEY);
    clearTokenCookie();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedExpires = localStorage.getItem(STORAGE_TOKEN_EXPIRES_KEY);

    if (storedUser && storedToken && storedExpires) {
      try {
        const expiresAt = Number(storedExpires);
        if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
          clearSession();
          return;
        }

        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser({
          ...parsedUser,
          role: parsedUser.role ?? "user",
          rendaMensal: normalizeMonthlyIncome(parsedUser.rendaMensal),
        });
        setToken(storedToken);

        const cookieToken = getTokenFromCookie();
        if (cookieToken !== storedToken) {
          setTokenCookie(storedToken);
        }
        refreshSessionExpiration(storedToken);
      } catch {
        clearSession();
      }
    } else if (storedUser || storedToken || storedExpires) {
      clearSession();
    }
  }, [clearSession, refreshSessionExpiration]);

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      setLoading(true);
      try {
        if (email === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
          const fakeToken = generateFakeToken();
          persistSession(
            {
              id: 0,
              nome: "Administrador",
              email: "admin@local",
              role: "admin",
              rendaMensal: 0,
            },
            fakeToken
          );
          return;
        }

        const resposta = await fetch(
          `${USERS_API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        );

        if (!resposta.ok) {
          throw new Error("Erro ao verificar credenciais");
        }

        const usuarios = await resposta.json();

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
          throw new Error("Usuário ou senha inválidos");
        }

        const usuarioEncontrado = usuarios[0] as Record<string, unknown>;
        const fakeToken = generateFakeToken();
        persistSession(mapApiUserToAuthUser(usuarioEncontrado), fakeToken);
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ nome, email, password, rendaMensal }: RegisterInput) => {
      setLoading(true);
      try {
        const resposta = await fetch(USERS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            email,
            password,
            role: "user",
            "renda-mensal": rendaMensal,
          }),
        });

        if (!resposta.ok) {
          throw new Error("Erro ao criar usuário");
        }

        const novoUsuario = await resposta.json();
        const fakeToken = generateFakeToken();
        persistSession(mapApiUserToAuthUser(novoUsuario), fakeToken);
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (!user || !token) return;

    const renew = () => {
      if (document.visibilityState === "visible") {
        refreshSessionExpiration(token);
      }
    };

    window.addEventListener("focus", renew);
    document.addEventListener("visibilitychange", renew);

    const intervalId = window.setInterval(() => {
      refreshSessionExpiration(token);
    }, Math.max(15, Math.floor(COOKIE_MAX_AGE_SECONDS / 2)) * 1000);

    refreshSessionExpiration(token);

    return () => {
      window.removeEventListener("focus", renew);
      document.removeEventListener("visibilitychange", renew);
      window.clearInterval(intervalId);
    };
  }, [user, token, refreshSessionExpiration]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: Boolean(user && user.role === "admin"),
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider");
  }
  return context;
};
