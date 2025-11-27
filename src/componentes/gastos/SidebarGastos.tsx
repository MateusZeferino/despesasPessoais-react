import type { FC } from "react";
import { MESES } from "../../constants/meses";

interface SidebarGastosProps {
  anosDisponiveis: number[];
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
  mesSelecionado: string;
  onSelecionarMes: (mes: string) => void;
}

const SidebarGastos: FC<SidebarGastosProps> = ({
  anosDisponiveis,
  anoSelecionado,
  onSelecionarAno,
  mesSelecionado,
  onSelecionarMes,
}) => {
  return (
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
                  onClick={() => onSelecionarAno(ano)}
                  aria-pressed={anoAtivo}
                >
                  {ano}
                  {anoAtivo && <span className="sr-only"> (Selecionado)</span>}
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
                onClick={() => onSelecionarMes(mes.valor)}
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
  );
};

export default SidebarGastos;

