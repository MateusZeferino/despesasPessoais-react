import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import CarregandoModal from "./componentes/carregandoModal";
import { useAuth } from "./auth/useAuth";
import { formatarMoeda, obterClasseStatusValor } from "./utils/finance";
import "./App.css";

interface Gasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  mes: string;
  userId: number;
}

type NovoGasto = {
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
};

const API_URL = "http://localhost:3001/gastos";

const ITENS_POR_PAGINA = 5;

const MESES = [
  { valor: "1", rotulo: "Janeiro" },
  { valor: "2", rotulo: "Fevereiro" },
  { valor: "3", rotulo: "Março" },
  { valor: "4", rotulo: "Abril" },
  { valor: "5", rotulo: "Maio" },
  { valor: "6", rotulo: "Junho" },
  { valor: "7", rotulo: "Julho" },
  { valor: "8", rotulo: "Agosto" },
  { valor: "9", rotulo: "Setembro" },
  { valor: "10", rotulo: "Outubro" },
  { valor: "11", rotulo: "Novembro" },
  { valor: "12", rotulo: "Dezembro" },
];

const dataAtual = new Date();
const MES_ATUAL_PADRAO = String(dataAtual.getMonth() + 1);

const getAnoDeGasto = (gasto: Gasto): number => {
  const ano = new Date(gasto.data).getFullYear();
  return Number.isNaN(ano) ? dataAtual.getFullYear() : ano;
};

function App() {
  const { user, logout, isAdmin } = useAuth();
  const rendaMensal = user?.rendaMensal ?? 0;
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    MES_ATUAL_PADRAO
  );
  const [todosGastos, setTodosGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoGasto, setNovoGasto] = useState<NovoGasto>({
    descricao: "",
    categoria: "",
    valor: 0,
    data: "",
  });
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    dataAtual.getFullYear()
  );
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  const anosDisponiveis = useMemo(() => {
    const anosSet = new Set<number>();

    todosGastos.forEach((gasto) => {
      anosSet.add(getAnoDeGasto(gasto));
    });

    return Array.from(anosSet).sort((a, b) => a - b);
  }, [todosGastos]);

  useEffect(() => {
    if (anosDisponiveis.length === 0) return;

    setAnoSelecionado((anoAtual) =>
      anoAtual && anosDisponiveis.includes(anoAtual)
        ? anoAtual
        : anosDisponiveis[anosDisponiveis.length - 1]
    );
  }, [anosDisponiveis]);

  useEffect(() => {
    if (!user || isAdmin) {
      setTodosGastos([]);
      return;
    }
    carregarTodosGastos(user.id);
  }, [user, isAdmin]);

  async function carregarTodosGastos(userId: number) {
    if (!userId) return;
    try {
      setCarregando(true);
      setErro(null);
      const resposta = await fetch(`${API_URL}?userId=${userId}`);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar gastos na API");
      }

      const dados: Gasto[] = await resposta.json();
      setTodosGastos(dados);
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao buscar gastos";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  const gastosFiltrados = useMemo(() => {
    if (!anoSelecionado || !user) return [];

    return todosGastos.filter((gasto) => {
      const anoGasto = getAnoDeGasto(gasto);
      return gasto.mes === mesSelecionado && anoGasto === anoSelecionado;
    });
  }, [mesSelecionado, todosGastos, anoSelecionado]);

  const totalGastosMes = useMemo(
    () => gastosFiltrados.reduce((soma, gasto) => soma + gasto.valor, 0),
    [gastosFiltrados]
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    setPaginaAtual((paginaAnterior) => {
      const totalPaginasCalculado = Math.max(
        1,
        Math.ceil(gastosFiltrados.length / ITENS_POR_PAGINA)
      );
      return Math.min(paginaAnterior, totalPaginasCalculado);
    });
  }, [gastosFiltrados.length]);

  const totalPaginas = useMemo(
    () =>
      Math.max(1, Math.ceil(gastosFiltrados.length / ITENS_POR_PAGINA)),
    [gastosFiltrados.length]
  );

  const gastosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return gastosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [gastosFiltrados, paginaAtual]);

  const classeValorTotalMes = useMemo(
    () => obterClasseStatusValor(totalGastosMes, rendaMensal),
    [totalGastosMes, rendaMensal]
  );

  function handleSelecionarMes(mes: string) {
    setMesSelecionado(mes);
    setGastoEditando(null);
  }

  function handleChangeNovoGasto(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target;
    setNovoGasto((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: name === "valor" ? Number(value) : value,
    }));
  }

  async function handleSubmitNovoGasto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!user) {
      setErro("Faça login novamente para adicionar gastos.");
      return;
    }

    try {
      setErro(null);

      const mesDaData =
        novoGasto.data.trim().length > 0
          ? String(new Date(novoGasto.data).getMonth() + 1)
          : mesSelecionado;

      const payload = {
        descricao: novoGasto.descricao,
        categoria: novoGasto.categoria,
        valor: novoGasto.valor,
        data: novoGasto.data,
        mes: mesDaData,
        userId: user.id,
      };

      const resposta = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao adicionar novo gasto");
      }

      const gastoCriado: Gasto = await resposta.json();
      setTodosGastos((estadoAnterior) => [...estadoAnterior, gastoCriado]);

      setNovoGasto({
        descricao: "",
        categoria: "",
        valor: 0,
        data: "",
      });
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao adicionar gasto";
      setErro(mensagem);
    }
  }

  function handleIniciarEdicao(gasto: Gasto) {
    setGastoEditando(gasto);
  }

  function handleChangeGastoEditando(evento: ChangeEvent<HTMLInputElement>) {
    if (!gastoEditando) return;
    const { name, value } = evento.target;
    setGastoEditando({
      ...gastoEditando,
      [name]: name === "valor" ? Number(value) : value,
    });
  }

  async function handleSalvarEdicao() {
    if (!gastoEditando) return;
    if (!user) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      setErro(null);

      const mesDaData =
        gastoEditando.data.trim().length > 0
          ? String(new Date(gastoEditando.data).getMonth() + 1)
          : gastoEditando.mes;

      const payloadAtualizado = {
        ...gastoEditando,
        mes: mesDaData,
        userId: user.id,
      };

      const resposta = await fetch(`${API_URL}/${gastoEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadAtualizado),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao atualizar gasto");
      }

      const gastoAtualizado: Gasto = await resposta.json();
      setTodosGastos((estadoAnterior) =>
        estadoAnterior.map((gasto) =>
          gasto.id === gastoAtualizado.id ? gastoAtualizado : gasto
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
    if (!user) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }
    try {
      setErro(null);

      const resposta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir gasto");
      }

      setTodosGastos((estadoAnterior) =>
        estadoAnterior.filter((gasto) => gasto.id !== id)
      );

      if (gastoEditando && gastoEditando.id === id) {
        setGastoEditando(null);
      }
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao excluir gasto";
      setErro(mensagem);
    }
  }

  function obterRotuloMes(valorMes: string): string {
    const encontrado = MESES.find((mes) => mes.valor === valorMes);
    return encontrado ? encontrado.rotulo : `Mês ${valorMes}`;
  }

  if (!user) {
    return null;
  }

  if (isAdmin) {
    return (
      <div className="app-layout">
        <main className="content-area">
          <div className="userbar">
            <div className="userbar-info">
              Olá, <strong>{user.nome}</strong>
            </div>
            <div className="userbar-actions">
              <Link to="/admin" className="secondary-btn">
                Painel admin
              </Link>
              <button className="ghost-btn" type="button" onClick={logout}>
                Sair
              </button>
            </div>
          </div>
          <div className="page-card">
            <header className="rich-header">
              <h1>Painel administrativo</h1>
              <p>
                Use o painel de administração para gerenciar usuários e gastos
                de todo o sistema.
              </p>
            </header>
            <Link to="/admin" className="primary-btn">
              Abrir painel administrativo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <CarregandoModal open={carregando} message="Carregando dados..." />

      <aside className="sidebar" aria-label="Seleção de meses e anos">
        <div className="year-filter" aria-label="Escolha do ano">
          <p className="sidebar-description">Ano</p>
          {anosDisponiveis.length === 0 ? (
            <p className="empty-state">Nenhum gasto cadastrado ainda.</p>
          ) : (
            <div className="year-buttons">
              {anosDisponiveis.map((ano) => {
                const anoAtivo = anoSelecionado === ano;
                return (
                  <button
                    key={ano}
                    type="button"
                    className={`year-option ${
                      anoAtivo ? "year-option--active" : ""
                    }`}
                    onClick={() => setAnoSelecionado(ano)}
                    aria-pressed={anoAtivo}
                  >
                    {ano}
                    {anoAtivo && (
                      <span className="sr-only"> (Selecionado)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <h2 className="sidebar-title">Meses</h2>
        <p className="sidebar-description">
          Escolha o mês para visualizar os gastos existentes.
        </p>
        <ul className="filters-list">
          {MESES.map((mes) => {
            const ativo = mesSelecionado === mes.valor;
            return (
              <li key={mes.valor}>
                <button
                  type="button"
                  className={`filter-button ${
                    ativo ? "filter-button--active" : ""
                  }`}
                  onClick={() => handleSelecionarMes(mes.valor)}
                  aria-pressed={ativo}
                >
                  <span className="filter-indicator" aria-hidden="true" />
                  <span>
                    {mes.rotulo}
                    {ativo && <span className="sr-only"> (Selecionado)</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="content-area">
        <div className="userbar">
          <div className="userbar-info">
            Olá, <strong>{user.nome}</strong>
          </div>
          <button className="secondary-btn" type="button" onClick={logout}>
            Sair
          </button>
        </div>

        <div className="page-card">
          <header className="rich-header">
            <h1>Gastos do mês de {obterRotuloMes(mesSelecionado)}</h1>
            <p>
              Aqui tu enxerga, adiciona, edita e exclui gastos do mês
              selecionado.
            </p>
          </header>

          <div className="monthly-total">
            <div className="monthly-total__info">
              <span>Total do mes</span>
              {rendaMensal > 0 && (
                <small>Renda mensal: {formatarMoeda(rendaMensal)}</small>
              )}
            </div>
            <strong
              className={`monthly-total__value valor-status ${classeValorTotalMes}`}
            >
              {formatarMoeda(totalGastosMes)}
            </strong>
          </div>

          {erro && (
            <div className="alert" role="alert">
              {erro}
            </div>
          )}

          {!carregando && gastosFiltrados.length === 0 && (
            <p className="empty-state">
              Nenhum gasto cadastrado para este mês ainda.
            </p>
          )}

          {carregando && (
            <p className="empty-state" aria-live="polite">
              Carregando gastos...
            </p>
          )}

          <section className="gastos-section">
            <h2>Lista de gastos</h2>
            <ul className="gastos-list">
              {gastosPaginados.map((gasto) => {
                const estaEditando = gastoEditando?.id === gasto.id;
                return (
                  <li key={gasto.id} className="gasto-card">
                    {estaEditando ? (
                      <div className="input-grid">
                        <input
                          className="input-field"
                          type="text"
                          name="descricao"
                          value={gastoEditando?.descricao ?? ""}
                          onChange={handleChangeGastoEditando}
                          placeholder="Descrição"
                        />
                        <input
                          className="input-field"
                          type="text"
                          name="categoria"
                          value={gastoEditando?.categoria ?? ""}
                          onChange={handleChangeGastoEditando}
                          placeholder="Categoria"
                        />
                        <input
                          className="input-field input-field--compact"
                          type="number"
                          name="valor"
                          value={gastoEditando?.valor ?? 0}
                          onChange={handleChangeGastoEditando}
                          placeholder="Valor"
                          step="0.01"
                        />
                        <input
                          className="input-field input-field--date"
                          type="date"
                          name="data"
                          value={gastoEditando?.data ?? ""}
                          onChange={handleChangeGastoEditando}
                        />
                      </div>
                    ) : (
                      <div className="gasto-card__body">
                        <div className="gasto-card__column">
                          <p className="gasto-card__title">{gasto.descricao}</p>
                          <p className="gasto-card__meta">{gasto.categoria}</p>
                        </div>
                        <div className="gasto-card__column gasto-card__column--right">
                          <span className="gasto-card__value">
                            R$ {gasto.valor.toFixed(2)}
                          </span>
                          <span className="gasto-card__meta">{gasto.data}</span>
                        </div>
                      </div>
                    )}

                    <div className="gasto-card__actions">
                      {estaEditando ? (
                        <>
                          <button
                            className="primary-btn"
                            type="button"
                            onClick={handleSalvarEdicao}
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
                          onClick={() => handleIniciarEdicao(gasto)}
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
            {gastosFiltrados.length > ITENS_POR_PAGINA && (
              <div className="pagination">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setPaginaAtual((pagina) => Math.max(1, pagina - 1))
                  }
                  disabled={paginaAtual === 1}
                >
                  Anterior
                </button>
                <span className="pagination__status">
                  Pagina {paginaAtual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setPaginaAtual((pagina) =>
                      Math.min(totalPaginas, pagina + 1)
                    )
                  }
                  disabled={paginaAtual === totalPaginas}
                >
                  Proxima
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="page-card">
          <section>
            <h2>Adicionar novo gasto</h2>
            <form
              onSubmit={handleSubmitNovoGasto}
              className="input-grid"
              aria-label="Formulário para adicionar novo gasto"
            >
              <input
                className="input-field"
                type="text"
                name="descricao"
                value={novoGasto.descricao}
                onChange={handleChangeNovoGasto}
                placeholder="Descrição"
                required
              />
              <input
                className="input-field"
                type="text"
                name="categoria"
                value={novoGasto.categoria}
                onChange={handleChangeNovoGasto}
                placeholder="Categoria"
                required
              />
              <input
                className="input-field"
                type="number"
                name="valor"
                value={novoGasto.valor === 0 ? "" : novoGasto.valor}
                onChange={handleChangeNovoGasto}
                placeholder="Valor"
                step="0.01"
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
              <button className="primary-btn" type="submit">
                Adicionar
              </button>
            </form>
          </section>

          <div className="cta-row">
            <Link to="/resumo-anual" className="cta-link">
              Ver Resumo Anual →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
