import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível fazer login";
      setErro(mensagem);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Entrar</h1>
          <p>Use suas credenciais para acessar seus gastos.</p>
        </header>

        {erro && (
          <div className="auth-error" role="alert">
            {erro}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-label">
            E-mail ou usuário
            <input
              className="input-field"
              type="text"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              placeholder="seu@email.com ou admin"
            />
          </label>

          <label className="input-label">
            Senha
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
              placeholder="••••••"
            />
          </label>

          <button className="primary-btn auth-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-link">
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
        <p className="auth-link">
          Acesso administrador: usuário <strong>admin</strong> / senha{" "}
          <strong>1234</strong>.
        </p>
      </div>
    </div>
  );
};

export default Login;
