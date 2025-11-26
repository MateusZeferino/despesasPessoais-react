import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { useAuth } from "./auth/useAuth";

interface Gasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  mes: string;
  userId: number;
}

const API_URL = "http://localhost:3001/gastos";

const MESES = [
  { numero: 1, rotuloCurto: "Jan", rotuloLongo: "Janeiro" },
  { numero: 2, rotuloCurto: "Fev", rotuloLongo: "Fevereiro" },
  { numero: 3, rotuloCurto: "Mar", rotuloLongo: "Março" },
  { numero: 4, rotuloCurto: "Abr", rotuloLongo: "Abril" },
  { numero: 5, rotuloCurto: "Mai", rotuloLongo: "Maio" },
  { numero: 6, rotuloCurto: "Jun", rotuloLongo: "Junho" },
  { numero: 7, rotuloCurto: "Jul", rotuloLongo: "Julho" },
  { numero: 8, rotuloCurto: "Ago", rotuloLongo: "Agosto" },
  { numero: 9, rotuloCurto: "Set", rotuloLongo: "Setembro" },
  { numero: 10, rotuloCurto: "Out", rotuloLongo: "Outubro" },
  { numero: 11, rotuloCurto: "Nov", rotuloLongo: "Novembro" },
  { numero: 12, rotuloCurto: "Dez", rotuloLongo: "Dezembro" },
];

const ResumoAnual: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isAdmin) {
      setGastos([]);
      setAnosDisponiveis([]);
      setAnoSelecionado(null);
      return;
    }

    const carregarGastos = async () => {
      try {
        setCarregando(true);
        setErro(null);

        const resposta = await fetch(`${API_URL}?userId=${user.id}`);
        if (!resposta.ok) {
          throw new Error("Erro ao buscar gastos na API");
        }

        const dados: Gasto[] = await resposta.json();
        setGastos(dados);

        const anosSet = new Set<number>();

        dados.forEach((gasto) => {
          const data = new Date(gasto.data);
          const ano = data.getFullYear();
          if (!Number.isNaN(ano)) {
            anosSet.add(ano);
          }
        });

        const anosOrdenados = Array.from(anosSet).sort((a, b) => a - b);
        setAnosDisponiveis(anosOrdenados);
        if (anosOrdenados.length > 0) {
          setAnoSelecionado(anosOrdenados[anosOrdenados.length - 1]);
        } else {
          setAnoSelecionado(null);
        }
      } catch (erroCapturado) {
        const mensagem =
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Erro desconhecido ao buscar gastos";
        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    };

    carregarGastos();
  }, [user, isAdmin]);

  const totaisPorMes: number[] = useMemo(() => {
    if (anoSelecionado === null || gastos.length === 0) {
      return new Array(12).fill(0);
    }

    const totais = new Array(12).fill(0);
    gastos.forEach((gasto) => {
      const data = new Date(gasto.data);
      const ano = data.getFullYear();
      if (ano !== anoSelecionado) return;

      const numeroMes =
        gasto.mes && !Number.isNaN(Number(gasto.mes))
          ? Number(gasto.mes)
          : data.getMonth() + 1;

      const indexMes = numeroMes - 1;
      if (indexMes >= 0 && indexMes < 12) {
        totais[indexMes] += gasto.valor;
      }
    });

    return totais;
  }, [gastos, anoSelecionado]);

  const totalAno = useMemo(
    () => totaisPorMes.reduce((soma, valorMes) => soma + valorMes, 0),
    [totaisPorMes]
  );

  const formatarValor = (valor: number): string =>
    `R$ ${valor.toFixed(2).replace(".", ",")}`;

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
                Utilize o painel administrativo para acompanhar os gastos de
                todos os usuários.
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
      <aside className="sidebar" aria-label="Seleção de anos">
        <h2 className="sidebar-title">Anos</h2>
        <p className="sidebar-description">
          Filtre o ano para visualizar o resumo anual dos gastos.
        </p>
        {anosDisponiveis.length === 0 && !carregando && (
          <p className="empty-state">Nenhum gasto cadastrado ainda.</p>
        )}
        <ul className="filters-list">
          {anosDisponiveis.map((ano) => {
            const ativo = anoSelecionado === ano;
            return (
              <li key={ano}>
                <button
                  type="button"
                  className={`filter-button ${
                    ativo ? "filter-button--active" : ""
                  }`}
                  onClick={() => setAnoSelecionado(ano)}
                  aria-pressed={ativo}
                >
                  <span className="filter-indicator" aria-hidden="true" />
                  <span>
                    {ano}
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
            <h1>
              Resumo anual de gastos
              {anoSelecionado ? ` - ${anoSelecionado}` : ""}
            </h1>
            <p>Visualização dos totais por mês e do total geral do ano.</p>
          </header>

          {erro && (
            <div className="alert" role="alert">
              {erro}
            </div>
          )}

          {carregando && (
            <p className="empty-state" aria-live="polite">
              Carregando dados...
            </p>
          )}

          {!carregando && anoSelecionado === null && (
            <p className="empty-state">
              Selecione um ano na barra lateral para ver o resumo.
            </p>
          )}

          {anoSelecionado !== null && (
            <>
              <section className="mes-grid" aria-label="Totais por mês">
                {MESES.map((mes, index) => (
                  <div key={mes.numero} className="mes-card">
                    <h3>{mes.rotuloLongo}</h3>
                    <div className="mes-card__value">
                      {formatarValor(totaisPorMes[index])}
                    </div>
                    <div className="mes-card__abbrev">{mes.rotuloCurto}</div>
                  </div>
                ))}
              </section>

              <section className="total-section" aria-live="polite">
                <h2>Total de gastos no ano</h2>
                <p>{formatarValor(totalAno)}</p>
              </section>
            </>
          )}

          <div className="cta-row">
            <Link to="/" className="cta-link">
              ← Voltar para gastos por mês
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumoAnual;
