export const formatarMoeda = (valor: number): string => {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
};

export const obterClasseStatusValor = (
  valor: number,
  rendaMensal: number
): string => {
  if (valor <= 0) return "valor-status--zerado";
  if (rendaMensal <= 0) return "valor-status--default";

  const proporcao = valor / rendaMensal;

  if (proporcao >= 1) {
    return "valor-status--critico";
  }

  if (proporcao >= 0.8) {
    return "valor-status--alerta";
  }

  return "valor-status--ok";
};
