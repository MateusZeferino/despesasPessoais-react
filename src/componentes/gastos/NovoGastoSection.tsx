import type { ChangeEvent, FC, FormEvent } from "react";
import type { NovoGasto } from "../../types/gastos";

interface NovoGastoSectionProps {
  novoGasto: NovoGasto;
  onChangeNovoGasto: (evento: ChangeEvent<HTMLInputElement>) => void;
  onSubmitNovoGasto: (evento: FormEvent<HTMLFormElement>) => void;
}

const NovoGastoSection: FC<NovoGastoSectionProps> = ({
  novoGasto,
  onChangeNovoGasto,
  onSubmitNovoGasto,
}) => {
  return (
    <section>
      <h2>Adicionar novo gasto</h2>
      <form
        onSubmit={onSubmitNovoGasto}
        className="input-grid"
        aria-label="Formulário para adicionar novo gasto"
      >
        <input
          className="input-field"
          type="text"
          name="descricao"
          value={novoGasto.descricao}
          onChange={onChangeNovoGasto}
          placeholder="Descrição"
          required
        />
        <input
          className="input-field"
          type="text"
          name="categoria"
          value={novoGasto.categoria}
          onChange={onChangeNovoGasto}
          placeholder="Categoria"
          required
        />
        <input
          className="input-field"
          type="number"
          name="valor"
          value={novoGasto.valor === 0 ? "" : novoGasto.valor}
          onChange={onChangeNovoGasto}
          placeholder="Valor"
          step="0.01"
          required
        />
        <input
          className="input-field"
          type="date"
          name="data"
          value={novoGasto.data}
          onChange={onChangeNovoGasto}
          required
        />
        <button className="primary-btn" type="submit">
          Adicionar
        </button>
      </form>
    </section>
  );
};

export default NovoGastoSection;

