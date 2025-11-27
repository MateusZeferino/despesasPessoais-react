import type { ChangeEvent, FC } from "react";
import { formatarMoeda } from "../../utils/finance";
import { obterRotuloMes } from "../../constants/meses";
import type { Gasto } from "../../types/gastos";

interface GastosSectionProps {
  mesSelecionado: string;
  rendaMensal: number;
  totalGastosMes: number;
  classeValorTotalMes: string;
  erro: string | null;
  carregando: boolean;
  gastosPaginados: Gasto[];
  gastosFiltradosCount: number;
  itensPorPagina: number;
  paginaAtual: number;
  totalPaginas: number;
  gastoEditando: Gasto | null;
  onIniciarEdicao: (gasto: Gasto) => void;
  onChangeGastoEditando: (evento: ChangeEvent<HTMLInputElement>) => void;
  onSalvarEdicao: () => void;
  onCancelarEdicao: () => void;
  onExcluirGasto: (id: string) => void;
  onPaginaAnterior: () => void;
  onPaginaProxima: () => void;
}

const GastosSection: FC<GastosSectionProps> = ({
  mesSelecionado,
  rendaMensal,
  totalGastosMes,
  classeValorTotalMes,
  erro,
  carregando,
  gastosPaginados,
  gastosFiltradosCount,
  itensPorPagina,
  paginaAtual,
  totalPaginas,
  gastoEditando,
  onIniciarEdicao,
  onChangeGastoEditando,
  onSalvarEdicao,
  onCancelarEdicao,
  onExcluirGasto,
  onPaginaAnterior,
  onPaginaProxima,
}) => {
  const possuiPaginacao = gastosFiltradosCount > itensPorPagina;

  return (
    <div className="page-card">
      <header className="rich-header">
        <h1>Gastos do mês de {obterRotuloMes(mesSelecionado)}</h1>
        <p>
          Aqui tu enxerga, adiciona, edita e exclui gastos do mês selecionado.
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

      {!carregando && gastosFiltradosCount === 0 && (
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
                      onChange={onChangeGastoEditando}
                      placeholder="Descrição"
                    />
                    <input
                      className="input-field"
                      type="text"
                      name="categoria"
                      value={gastoEditando?.categoria ?? ""}
                      onChange={onChangeGastoEditando}
                      placeholder="Categoria"
                    />
                    <input
                      className="input-field input-field--compact"
                      type="number"
                      name="valor"
                      value={gastoEditando?.valor ?? 0}
                      onChange={onChangeGastoEditando}
                      placeholder="Valor"
                      step="0.01"
                    />
                    <input
                      className="input-field input-field--date"
                      type="date"
                      name="data"
                      value={gastoEditando?.data ?? ""}
                      onChange={onChangeGastoEditando}
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
                        onClick={onSalvarEdicao}
                      >
                        Salvar
                      </button>
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={onCancelarEdicao}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => onIniciarEdicao(gasto)}
                    >
                      Editar
                    </button>
                  )}

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => onExcluirGasto(gasto.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {possuiPaginacao && (
          <div className="pagination">
            <button
              type="button"
              className="secondary-btn"
              onClick={onPaginaAnterior}
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
              onClick={onPaginaProxima}
              disabled={paginaAtual === totalPaginas}
            >
              Proxima
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default GastosSection;

