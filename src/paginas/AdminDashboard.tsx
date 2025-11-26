import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import "../App.css";

const USERS_API_URL = "http://localhost:3001/users";
const GASTOS_API_URL = "http://localhost:3001/gastos";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  password?: string;
  role: "admin" | "user";
}

interface AdminGasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  mes: string;
  userId: number;
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [gastos, setGastos] = useState<AdminGasto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    password: "",
    role: "user",
  });
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  const [novoGasto, setNovoGasto] = useState({
    descricao: "",
    categoria: "",
    valor: 0,
    data: "",
    userId: "",
  });
  const [gastoEditando, setGastoEditando] = useState<AdminGasto | null>(null);
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  const usuarioMap = useMemo(() => {
    const map = new Map<number, Usuario>();
    usuarios.forEach((usuario) => map.set(usuario.id, usuario));
    return map;
  }, [usuarios]);

  const gastosFiltrados = useMemo(() => {
    if (filtroUsuario === "todos") {
      return gastos;
    }
    const id = Number(filtroUsuario);
    return gastos.filter((gasto) => gasto.userId === id);
  }, [gastos, filtroUsuario]);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [usuariosResp, gastosResp] = await Promise.all([
        fetch(USERS_API_URL),
        fetch(GASTOS_API_URL),
      ]);

      if (!usuariosResp.ok || !gastosResp.ok) {
        throw new Error("Erro ao buscar dados administrativos");
      }

      const usuariosDados = (await usuariosResp.json()) as Usuario[];
      const gastosDados = (await gastosResp.json()) as AdminGasto[];

      setUsuarios(
        usuariosDados.map((dados) => ({
          ...dados,
          id: typeof dados.id === "number" ? dados.id : Number(dados.id),
          role: dados.role ?? "user",
        }))
      );

      setGastos(
        gastosDados.map((gasto) => ({
          ...gasto,
          userId:
            typeof gasto.userId === "number" ? gasto.userId : Number(gasto.userId),
        }))
      );
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao carregar dados";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  function handleChangeNovoUsuario(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = evento.target;
    setNovoUsuario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function handleCriarUsuario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    try {
      const resposta = await fetch(USERS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoUsuario),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao criar usuário");
      }

      const criado = await resposta.json();
      setUsuarios((lista) => [
        ...lista,
        {
          ...criado,
          id: typeof criado.id === "number" ? criado.id : Number(criado.id),
          role: criado.role ?? "user",
        },
      ]);
      setNovoUsuario({
        nome: "",
        email: "",
        password: "",
        role: "user",
      });
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao criar usuário";
      setErro(mensagem);
    }
  }

  function handleEditarUsuario(usuario: Usuario) {
    setUsuarioEditando({ ...usuario, password: "" });
  }

  function handleChangeUsuarioEditando(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!usuarioEditando) return;
    const { name, value } = evento.target;
    setUsuarioEditando({
      ...usuarioEditando,
      [name]: name === "role" ? (value as "admin" | "user") : value,
    });
  }

  async function handleSalvarUsuario() {
    if (!usuarioEditando) return;
    setErro(null);

    try {
      const payload: Record<string, unknown> = { ...usuarioEditando };
      if (!usuarioEditando.password) {
        delete payload.password;
      }

      const resposta = await fetch(`${USERS_API_URL}/${usuarioEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao atualizar usuário");
      }

      const atualizado = await resposta.json();
      setUsuarios((lista) =>
        lista.map((usuario) =>
          usuario.id === usuarioEditando.id
            ? {
                ...atualizado,
                id:
                  typeof atualizado.id === "number"
                    ? atualizado.id
                    : Number(atualizado.id),
                role: atualizado.role ?? "user",
              }
            : usuario
        )
      );
      setUsuarioEditando(null);
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao atualizar usuário";
      setErro(mensagem);
    }
  }

  async function handleExcluirUsuario(id: number) {
    if (!window.confirm("Excluir este usuário e seus gastos?")) {
      return;
    }

    setErro(null);
    try {
      const resposta = await fetch(`${USERS_API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir usuário");
      }

      const gastosDoUsuario = gastos.filter((gasto) => gasto.userId === id);
      await Promise.all(
        gastosDoUsuario.map((gasto) =>
          fetch(`${GASTOS_API_URL}/${gasto.id}`, { method: "DELETE" })
        )
      );

      setUsuarios((lista) => lista.filter((usuario) => usuario.id !== id));
      setGastos((lista) => lista.filter((gasto) => gasto.userId !== id));
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao excluir usuário";
      setErro(mensagem);
    }
  }

  function handleChangeNovoGasto(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = evento.target;
    setNovoGasto((anterior) => ({
      ...anterior,
      [name]: name === "valor" ? Number(value) : value,
    }));
  }

  async function handleCriarGasto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const userId = Number(novoGasto.userId);
    if (!userId) {
      setErro("Selecione um usuário para o gasto.");
      return;
    }

    const mes = novoGasto.data
      ? String(new Date(novoGasto.data).getMonth() + 1)
      : "";

    try {
      const resposta = await fetch(GASTOS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: novoGasto.descricao,
          categoria: novoGasto.categoria,
          valor: novoGasto.valor,
          data: novoGasto.data,
          mes,
          userId,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao criar gasto");
      }

      const criado = await resposta.json();
      setGastos((lista) => [
        ...lista,
        {
          ...criado,
          userId:
            typeof criado.userId === "number"
              ? criado.userId
              : Number(criado.userId),
        },
      ]);
      setNovoGasto({
        descricao: "",
        categoria: "",
        valor: 0,
        data: "",
        userId: "",
      });
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao criar gasto";
      setErro(mensagem);
    }
  }

  function handleEditarGasto(gasto: AdminGasto) {
    setGastoEditando({ ...gasto });
  }

  function handleChangeGastoEditando(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!gastoEditando) return;
    const { name, value } = evento.target;
    setGastoEditando({
      ...gastoEditando,
      [name]:
        name === "valor"
          ? Number(value)
          : name === "userId"
          ? Number(value)
          : value,
    });
  }

  async function handleSalvarGasto() {
    if (!gastoEditando) return;
    setErro(null);

    const mes = gastoEditando.data
      ? String(new Date(gastoEditando.data).getMonth() + 1)
      : gastoEditando.mes;

    try {
      const resposta = await fetch(`${GASTOS_API_URL}/${gastoEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...gastoEditando,
          mes,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao atualizar gasto");
      }

      const atualizado = await resposta.json();
      setGastos((lista) =>
        lista.map((gasto) =>
          gasto.id === gastoEditando.id
            ? {
                ...atualizado,
                userId:
                  typeof atualizado.userId === "number"
                    ? atualizado.userId
                    : Number(atualizado.userId),
              }
            : gasto
        )
      );
      setGastoEditando(null);
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao atualizar gasto";
      setErro(mensagem);
    }
  }

  async function handleExcluirGasto(id: string) {
    setErro(null);
    try {
      const resposta = await fetch(`${GASTOS_API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir gasto");
      }

      setGastos((lista) => lista.filter((gasto) => gasto.id !== id));
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao excluir gasto";
      setErro(mensagem);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-layout">
      <main className="content-area">
        <div className="userbar">
          <div className="userbar-info">
            Administrador conectado: <strong>{user.nome}</strong>
          </div>
          <div className="userbar-actions">
            <Link to="/" className="secondary-btn">
              Voltar ao app
            </Link>
            <button className="ghost-btn" type="button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>

        {erro && (
          <div className="alert" role="alert">
            {erro}
          </div>
        )}

        {carregando && (
          <p className="empty-state" aria-live="polite">
            Carregando dados administrativos...
          </p>
        )}

        <div className="admin-grid">
          <section className="page-card admin-section">
            <header className="rich-header">
              <h2>Gerenciar usuários</h2>
              <p>Crie novos acessos, atualize informações ou remova contas.</p>
            </header>

            <form className="admin-form" onSubmit={handleCriarUsuario}>
              <input
                className="input-field"
                type="text"
                name="nome"
                placeholder="Nome completo"
                value={novoUsuario.nome}
                onChange={handleChangeNovoUsuario}
                required
              />
              <input
                className="input-field"
                type="email"
                name="email"
                placeholder="E-mail"
                value={novoUsuario.email}
                onChange={handleChangeNovoUsuario}
                required
              />
              <input
                className="input-field"
                type="password"
                name="password"
                placeholder="Senha"
                value={novoUsuario.password}
                onChange={handleChangeNovoUsuario}
                required
              />
              <select
                className="input-field"
                name="role"
                value={novoUsuario.role}
                onChange={handleChangeNovoUsuario}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              <button className="primary-btn" type="submit">
                Criar usuário
              </button>
            </form>

            <ul className="admin-list">
              {usuarios.map((usuario) => {
                const emEdicao = usuarioEditando?.id === usuario.id;
                return (
                  <li key={usuario.id} className="admin-item">
                    {emEdicao ? (
                      <div className="admin-edit-grid">
                        <input
                          className="input-field"
                          type="text"
                          name="nome"
                          value={usuarioEditando?.nome ?? ""}
                          onChange={handleChangeUsuarioEditando}
                        />
                        <input
                          className="input-field"
                          type="email"
                          name="email"
                          value={usuarioEditando?.email ?? ""}
                          onChange={handleChangeUsuarioEditando}
                        />
                        <input
                          className="input-field"
                          type="password"
                          name="password"
                          value={usuarioEditando?.password ?? ""}
                          onChange={handleChangeUsuarioEditando}
                          placeholder="Senha (opcional)"
                        />
                        <select
                          className="input-field"
                          name="role"
                          value={usuarioEditando?.role ?? "user"}
                          onChange={handleChangeUsuarioEditando}
                        >
                          <option value="user">Usuário</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    ) : (
                      <div className="admin-item__info">
                        <div>
                          <strong>{usuario.nome}</strong> ({usuario.email})
                        </div>
                        <span className="badge">
                          {usuario.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </div>
                    )}

                    <div className="admin-item__actions">
                      {emEdicao ? (
                        <>
                          <button
                            className="primary-btn"
                            type="button"
                            onClick={handleSalvarUsuario}
                          >
                            Salvar
                          </button>
                          <button
                            className="secondary-btn"
                            type="button"
                            onClick={() => setUsuarioEditando(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          className="secondary-btn"
                          type="button"
                          onClick={() => handleEditarUsuario(usuario)}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => handleExcluirUsuario(usuario.id)}
                        disabled={usuario.id === user.id}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="page-card admin-section">
            <header className="rich-header">
              <h2>Gastos cadastrados</h2>
              <p>Visualize e ajuste os lançamentos de qualquer usuário.</p>
            </header>

            <div className="admin-controls">
              <label className="input-label">
                Filtrar por usuário
                <select
                  className="input-field"
                  value={filtroUsuario}
                  onChange={(evento) => setFiltroUsuario(evento.target.value)}
                >
                  <option value="todos">Todos</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <form className="admin-form" onSubmit={handleCriarGasto}>
              <input
                className="input-field"
                type="text"
                name="descricao"
                placeholder="Descrição"
                value={novoGasto.descricao}
                onChange={handleChangeNovoGasto}
                required
              />
              <input
                className="input-field"
                type="text"
                name="categoria"
                placeholder="Categoria"
                value={novoGasto.categoria}
                onChange={handleChangeNovoGasto}
                required
              />
              <input
                className="input-field"
                type="number"
                step="0.01"
                name="valor"
                placeholder="Valor"
                value={novoGasto.valor === 0 ? "" : novoGasto.valor}
                onChange={handleChangeNovoGasto}
                required
              />
              <input
                className="input-field"
                type="date"
                name="data"
                value={novoGasto.data}
                onChange={handleChangeNovoGasto}
                required
              />
              <select
                className="input-field"
                name="userId"
                value={novoGasto.userId}
                onChange={handleChangeNovoGasto}
                required
              >
                <option value="">Selecione um usuário</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
              <button className="primary-btn" type="submit">
                Registrar gasto
              </button>
            </form>

            <ul className="admin-list">
              {gastosFiltrados.map((gasto) => {
                const emEdicao = gastoEditando?.id === gasto.id;
                const usuarioDoGasto = usuarioMap.get(gasto.userId);

                return (
                  <li key={gasto.id} className="admin-item">
                    {emEdicao ? (
                      <div className="admin-edit-grid">
                        <input
                          className="input-field"
                          type="text"
                          name="descricao"
                          value={gastoEditando?.descricao ?? ""}
                          onChange={handleChangeGastoEditando}
                        />
                        <input
                          className="input-field"
                          type="text"
                          name="categoria"
                          value={gastoEditando?.categoria ?? ""}
                          onChange={handleChangeGastoEditando}
                        />
                        <input
                          className="input-field"
                          type="number"
                          step="0.01"
                          name="valor"
                          value={gastoEditando?.valor ?? 0}
                          onChange={handleChangeGastoEditando}
                        />
                        <input
                          className="input-field"
                          type="date"
                          name="data"
                          value={gastoEditando?.data ?? ""}
                          onChange={handleChangeGastoEditando}
                        />
                        <select
                          className="input-field"
                          name="userId"
                          value={
                            gastoEditando ? String(gastoEditando.userId) : ""
                          }
                          onChange={handleChangeGastoEditando}
                        >
                          {usuarios.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                              {usuario.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="admin-item__info admin-item__info--column">
                        <div>
                          <strong>{gasto.descricao}</strong> - {gasto.categoria}
                        </div>
                        <div>
                          Valor: R$ {gasto.valor.toFixed(2)} • Data: {gasto.data}
                        </div>
                        <div>
                          Usuário: {usuarioDoGasto?.nome ?? "Desconhecido"}
                        </div>
                      </div>
                    )}

                    <div className="admin-item__actions">
                      {emEdicao ? (
                        <>
                          <button
                            className="primary-btn"
                            type="button"
                            onClick={handleSalvarGasto}
                          >
                            Salvar
                          </button>
                          <button
                            className="secondary-btn"
                            type="button"
                            onClick={() => setGastoEditando(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          className="secondary-btn"
                          type="button"
                          onClick={() => handleEditarGasto(gasto)}
                        >
                          Editar
                        </button>
                      )}

                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => handleExcluirGasto(gasto.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
