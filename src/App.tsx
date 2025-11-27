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
import { obterClasseStatusValor } from "./utils/finance";
import SidebarGastos from "./componentes/gastos/SidebarGastos";
import GastosSection from "./componentes/gastos/GastosSection";
import NovoGastoSection from "./componentes/gastos/NovoGastoSection";
import type { Gasto, NovoGasto } from "./types/gastos";
import "./App.css";

const API_URL = "http://localhost:3001/gastos";

const ITENS_POR_PAGINA = 5;

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

      <SidebarGastos
        anosDisponiveis={anosDisponiveis}
        anoSelecionado={anoSelecionado}
        onSelecionarAno={setAnoSelecionado}
        mesSelecionado={mesSelecionado}
        onSelecionarMes={handleSelecionarMes}
      />

      <main className="content-area">
        <div className="userbar">
          <div className="userbar-info">
            Olá, <strong>{user.nome}</strong>
          </div>
          <button className="secondary-btn" type="button" onClick={logout}>
            Sair
          </button>
        </div>

        <GastosSection
          mesSelecionado={mesSelecionado}
          rendaMensal={rendaMensal}
          totalGastosMes={totalGastosMes}
          classeValorTotalMes={classeValorTotalMes}
          erro={erro}
          carregando={carregando}
          gastosPaginados={gastosPaginados}
          gastosFiltradosCount={gastosFiltrados.length}
          itensPorPagina={ITENS_POR_PAGINA}
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          gastoEditando={gastoEditando}
          onIniciarEdicao={handleIniciarEdicao}
          onChangeGastoEditando={handleChangeGastoEditando}
          onSalvarEdicao={handleSalvarEdicao}
          onCancelarEdicao={() => setGastoEditando(null)}
          onExcluirGasto={handleExcluirGasto}
          onPaginaAnterior={() =>
            setPaginaAtual((pagina) => Math.max(1, pagina - 1))
          }
          onPaginaProxima={() =>
            setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
          }
        />

        <div className="page-card">
          <NovoGastoSection
            novoGasto={novoGasto}
            onChangeNovoGasto={handleChangeNovoGasto}
            onSubmitNovoGasto={handleSubmitNovoGasto}
          />

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
