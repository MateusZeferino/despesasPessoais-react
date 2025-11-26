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

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: "admin" | "user";
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  nome: string;
  email: string;
  password: string;
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

const generateFakeToken = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser({
          ...parsedUser,
          role: parsedUser.role ?? "user",
        });
        setToken(storedToken);
      } catch {
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    }
  }, []);

  const persistSession = useCallback((sessionUser: AuthUser, sessionToken: string) => {
    setUser(sessionUser);
    setToken(sessionToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem(STORAGE_TOKEN_KEY, sessionToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }, []);

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

        const usuarioEncontrado = usuarios[0] as AuthUser;
        const fakeToken = generateFakeToken();
        persistSession(
          {
            id:
              typeof usuarioEncontrado.id === "number"
                ? usuarioEncontrado.id
                : Number(usuarioEncontrado.id),
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email,
            role: usuarioEncontrado.role ?? "user",
          },
          fakeToken
        );
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ nome, email, password }: RegisterInput) => {
      setLoading(true);
      try {
        const resposta = await fetch(USERS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nome, email, password, role: "user" }),
        });

        if (!resposta.ok) {
          throw new Error("Erro ao criar usuário");
        }

        const novoUsuario = await resposta.json();
        const fakeToken = generateFakeToken();
        persistSession(
          {
            id:
              typeof novoUsuario.id === "number"
                ? novoUsuario.id
                : Number(novoUsuario.id),
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            role: novoUsuario.role ?? "user",
          },
          fakeToken
        );
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
