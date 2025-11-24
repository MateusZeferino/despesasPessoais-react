import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";


// Mesmo tipo de gasto usado no outro app
interface Gasto {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // formato "YYYY-MM-DD"
  mes: string;  // "1"..."12"
}

// URL da API do json-server
const API_URL = "http://localhost:3001/gastos";

// Lista de meses pra montar os quadradinhos
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

// Componente da tela de resumo anual
const ResumoAnual: React.FC = () => {
  // Todos os gastos carregados da API
  const [gastos, setGastos] = useState<Gasto[]>([]);

  // Anos que existem nos dados (somente com gasto cadastrado)
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  // Ano atualmente selecionado na sidebar
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  // Estados de carregamento/erro
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega todos os gastos quando a tela monta
  useEffect(() => {
    const carregarGastos = async () => {
      try {
        setCarregando(true);
        setErro(null);

        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
          throw new Error("Erro ao buscar gastos na API");
        }

        const dados: Gasto[] = await resposta.json();
        setGastos(dados);

        // Extrai os anos a partir do campo "data"
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

        // Deixa selecionado o ano mais recente por padrão
        if (anosOrdenados.length > 0) {
          setAnoSelecionado(anosOrdenados[anosOrdenados.length - 1]);
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
  }, []);

  // Calcula os totais por mês para o ano selecionado
  const totaisPorMes: number[] = useMemo(() => {
    // Se ainda não tem ano selecionado ou sem dados, devolve tudo 0
    if (anoSelecionado === null || gastos.length === 0) {
      return new Array(12).fill(0);
    }

    const totais = new Array(12).fill(0); // index 0 -> janeiro, 11 -> dezembro

    gastos.forEach((gasto) => {
      const data = new Date(gasto.data);
      const ano = data.getFullYear();

      if (ano !== anoSelecionado) return;

      // Usa o campo "mes"; se der ruim, tenta extrair da data
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

  // Total geral do ano (soma de todos os meses)
  const totalAno = useMemo(
    () => totaisPorMes.reduce((soma, valorMes) => soma + valorMes, 0),
    [totaisPorMes]
  );

  // Formata número em "R$ 0,00"
  const formatarValor = (valor: number): string => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  const handleSelecionarAno = (ano: number) => {
    setAnoSelecionado(ano);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* SIDEBAR DE ANOS */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2
          style={{
            marginBottom: "12px",
            fontSize: "18px",
          }}
        >
          Anos
        </h2>

        {anosDisponiveis.length === 0 && !carregando && (
          <p style={{ fontSize: "14px", color: "#666" }}>
            Nenhum gasto cadastrado ainda.
          </p>
        )}

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {anosDisponiveis.map((ano) => (
            <li key={ano} style={{ marginBottom: "8px" }}>
              <button
                type="button"
                onClick={() => handleSelecionarAno(ano)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border:
                    anoSelecionado === ano
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                  backgroundColor:
                    anoSelecionado === ano ? "#e3f2fd" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {ano}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          flex: 1,
          padding: "24px",
          backgroundColor: "#ffffff",
        }}
      >
        <header style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              marginBottom: "8px",
            }}
          >
            Resumo anual de gastos
            {anoSelecionado ? ` - ${anoSelecionado}` : ""}
          </h1>
          <p
            style={{
              margin: 0,
              color: "#555",
              fontSize: "14px",
            }}
          >
            Visualização dos totais por mês e do total geral do ano.
          </p>
        </header>

        {erro && (
          <div
            style={{
              marginBottom: "16px",
              padding: "8px 12px",
              borderRadius: "4px",
              backgroundColor: "#ffebee",
              color: "#c62828",
              border: "1px solid #ef9a9a",
            }}
          >
            {erro}
          </div>
        )}

        {carregando && (
          <p
            style={{
              marginBottom: "16px",
              fontStyle: "italic",
            }}
          >
            Carregando dados...
          </p>
        )}

        {!carregando && anoSelecionado === null && (
          <p style={{ color: "#777" }}>
            Selecione um ano na barra lateral para ver o resumo.
          </p>
        )}

        {anoSelecionado !== null && (
          <>
            {/* GRID DOS 12 MESES (2 linhas, 6 colunas) */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {MESES.map((mes, index) => {
                const totalMes = totaisPorMes[index];

                return (
                  <div
                    key={mes.numero}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      padding: "12px",
                      backgroundColor: "#fafafa",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "90px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      {mes.rotuloLongo}
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      {formatarValor(totalMes)}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginTop: "4px",
                      }}
                    >
                      {mes.rotuloCurto}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* TOTAL GERAL DO ANO */}
            <section>
              <h2
                style={{
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                Total de gastos no ano
              </h2>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                {formatarValor(totalAno)}
              </p>
            </section>
          </>
        )}
        <div style={{ marginBottom: "16px",
            marginTop: "40px",
         }}>
            <Link to="/" style={{ textDecoration: "none", color: "#202020ff", fontSize: "20px", border: "1px solid #202020ff", borderRadius:"5px" , padding: "10px" }}>
            ← Voltar para gastos por mês
            </Link>
        </div>
      </main>
    </div>
  );
};

export default ResumoAnual;
