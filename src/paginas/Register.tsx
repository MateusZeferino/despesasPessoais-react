import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rendaMensal, setRendaMensal] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (password !== confirmPassword) {
      setErro("As senhas não conferem");
      return;
    }

    const rendaNumero = Number(rendaMensal);
    if (Number.isNaN(rendaNumero) || rendaNumero < 0) {
      setErro("Informe uma renda mensal valida");
      return;
    }

    try {
      await register({ nome, email, password, rendaMensal: rendaNumero });
      navigate("/", { replace: true });
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível criar a conta";
      setErro(mensagem);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Criar conta</h1>
          <p>Cadastre-se para salvar seus gastos pessoais.</p>
        </header>

        {erro && (
          <div className="auth-error" role="alert">
            {erro}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-label">
            Nome completo
            <input
              className="input-field"
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              required
              placeholder="Seu nome"
            />
          </label>

          <label className="input-label">
            Email
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              placeholder="seu@email.com"
            />
          </label>

          <label className="input-label">
            Renda mensal
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.01"
              value={rendaMensal}
              onChange={(evento) => setRendaMensal(evento.target.value)}
              required
              placeholder="Ex.: 2000"
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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </label>

          <label className="input-label">
            Confirmar senha
            <input
              className="input-field"
              type="password"
              value={confirmPassword}
              onChange={(evento) => setConfirmPassword(evento.target.value)}
              required
              minLength={6}
            />
          </label>

          <button className="primary-btn auth-submit" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-link">
          Já tem uma conta? <Link to="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
