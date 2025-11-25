// Importa o React em si e alguns hooks/tipos específicos do React
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CarregandoModal from "./componentes/carregandoModal";



// Define a interface (tipo) de um Gasto, espelhando a estrutura do db.json
interface Gasto {
  id: number;          
  descricao: string;   
  categoria: string;   
  valor: number;       
  data: string;        
  mes: string;         
}

// Define um tipo auxiliar para o formulário de "novo gasto"
// Aqui não precisamos de id nem mes, porque o id é gerado pelo json-server
// e o mes será calculado automaticamente a partir da data (ou do mês selecionado)
type NovoGasto = {
  descricao: string;   
  categoria: string;   
  valor: number;       
  data: string;        
};

// Constante com a URL base da API do json-server
// Aqui supomos que o json-server está rodando na porta 3000 com recurso /gastos
const API_URL = "http://localhost:3001/gastos";

// Cria uma lista de meses para exibir na sidebar
// valor -> o que será enviado na query (?mes=valor)
// rotulo -> o texto amigável que aparece para o usuário
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

// Calcula, fora do componente, qual é o mês atual do dispositivo
// new Date() pega a data atual do sistema
const dataAtual = new Date();

// getMonth() retorna 0-11, então somamos 1 para ficar 1-12
const MES_ATUAL_PADRAO = String(dataAtual.getMonth() + 1);

// Define o componente principal do app
function App() {

  // Estado que armazena o mês atualmente selecionado na sidebar
  // Começa com o mês atual do dispositivo (MES_ATUAL_PADRAO)
  const [mesSelecionado, setMesSelecionado] = useState<string>(MES_ATUAL_PADRAO);

  // Estado que guarda a lista de gastos retornada da API para o mês selecionado
  const [gastos, setGastos] = useState<Gasto[]>([]);

  // Estado para controle de "carregando" (usado enquanto fazemos requisições async)
  const [carregando, setCarregando] = useState<boolean>(false);

  // Estado para mensagem de erro genérica, caso algo dê errado na requisição
  const [erro, setErro] = useState<string | null>(null);

  // Estado para o formulário de criação de um novo gasto
  // Inicia com campos vazios (e valor 0)
  const [novoGasto, setNovoGasto] = useState<NovoGasto>({
    descricao: "",      
    categoria: "",      
    valor: 0,           
    data: "",          
  });

  // Estado para armazenar o gasto que está em modo de edição (se houver)
  // Se for null, significa que nenhum gasto está sendo editado no momento
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);

  // useEffect é disparado sempre que o mesSelecionado mudar
  // Isso garante que ao abrir a tela (mês atual) ou trocar de mês na sidebar,
  // o app sempre busque os gastos do mês em questão
  useEffect(() => {
  
    buscarGastosPorMes(mesSelecionado);
    
  }, [mesSelecionado]);

  // Função assíncrona que busca na API todos os gastos de um certo mês
  async function buscarGastosPorMes(mes: string) {
    
    try {
      
      setCarregando(true);
      
      setErro(null);

      // Faz a requisição GET na API, filtrando pelo mês (?mes=...)
      const resposta = await fetch(`${API_URL}?mes=${mes}`);

      // Se a resposta não estiver "ok" (status 200-299), disparamos um erro
      if (!resposta.ok) {
        throw new Error("Erro ao buscar gastos na API");
      }

      // Converte o JSON retornado em um array de Gasto
      const dados: Gasto[] = await resposta.json();

      // Atualiza o estado "gastos" com os dados retornados
      setGastos(dados);
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

  // Handler para quando o usuário clicar em um mês na sidebar
  function handleSelecionarMes(mes: string) {
    
    setMesSelecionado(mes);
   
    setGastoEditando(null);
  }

  // Handler para mudanças nos campos do formulário de "novo gasto"
  // Recebe o evento de mudança em um input do tipo HTMLInputElement
  function handleChangeNovoGasto(evento: ChangeEvent<HTMLInputElement>) {
    // Desestrutura o nome e o valor do input que disparou o evento
    const { name, value } = evento.target;

    // Atualiza o estado do novo gasto com base no campo alterado
    setNovoGasto((estadoAnterior) => ({
      // Mantém os outros campos como estavam
      ...estadoAnterior,
      // Para o campo "valor", convertemos para número
      // Para os demais, mantemos como string
      [name]: name === "valor" ? Number(value) : value,
    }));
  }

  // Handler para o envio do formulário de "novo gasto"
  async function handleSubmitNovoGasto(evento: FormEvent<HTMLFormElement>) {
    // Evita o comportamento padrão do form (recarregar a página)
    evento.preventDefault();

    // Iniciamos um try/catch para tratar erros na requisição POST
    try {
      // Limpa qualquer erro anterior
      setErro(null);

      // Calcula o mês a partir da data digitada no formulário, se houver
      // Se o usuário não informar data, usamos o mês atualmente selecionado
      const mesDaData =
        novoGasto.data.trim().length > 0
          ? String(new Date(novoGasto.data).getMonth() + 1)
          : mesSelecionado;

      // Monta o payload que será enviado para a API
      // Inclui todos os campos do novoGasto + o campo mes calculado acima
      const payload = {
        descricao: novoGasto.descricao,
        categoria: novoGasto.categoria,
        valor: novoGasto.valor,
        data: novoGasto.data,
        mes: mesDaData,
      };

      // Faz a requisição POST na API para criar um novo gasto
      const resposta = await fetch(API_URL, {
        method: "POST",                             // Método HTTP POST
        headers: {
          "Content-Type": "application/json",       // Informa que o corpo é JSON
        },
        body: JSON.stringify(payload),              // Converte o payload para string JSON
      });

      // Se algo der errado (status não ok), lançamos um erro
      if (!resposta.ok) {
        throw new Error("Erro ao adicionar novo gasto");
      }

      // Converte o JSON da resposta para um objeto Gasto (com id gerado pela API)
      const gastoCriado: Gasto = await resposta.json();

      // Se o gasto criado pertence ao mês atualmente selecionado,
      // adicionamos ele na lista exibida
      if (gastoCriado.mes === mesSelecionado) {
        // Atualiza o estado "gastos" adicionando o novo gasto no final do array
        setGastos((estadoAnterior) => [...estadoAnterior, gastoCriado]);
      }

      // Reseta o formulário de novo gasto para valores iniciais
      setNovoGasto({
        descricao: "",
        categoria: "",
        valor: 0,
        data: "",
      });
    } catch (erroCapturado) {
      // Se ocorrer erro, extraímos a mensagem
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao adicionar gasto";
      // Guardamos essa mensagem em "erro" para exibir ao usuário
      setErro(mensagem);
    }
  }

  // Handler para iniciar a edição de um gasto específico
  function handleIniciarEdicao(gasto: Gasto) {
    // Define o gasto selecionado como o gasto que está sendo editado
    setGastoEditando(gasto);
  }

  // Handler para mudanças nos inputs de edição de um gasto existente
  function handleChangeGastoEditando(evento: ChangeEvent<HTMLInputElement>) {
    // Se não há gasto em edição, não precisamos fazer nada
    if (!gastoEditando) return;

    // Desestrutura o nome e o valor do campo que disparou o evento
    const { name, value } = evento.target;

    // Atualiza o estado do gasto em edição com o novo valor do campo
    setGastoEditando({
      // Copia o estado anterior do gasto
      ...gastoEditando,
      // Converte para número se o campo for "valor"
      [name]: name === "valor" ? Number(value) : value,
    });
  }

  // Handler para salvar as alterações de um gasto em edição (PUT na API)
  async function handleSalvarEdicao() {
    // Se não há gasto em edição, não faz nada
    if (!gastoEditando) return;

    // Envolve a lógica em try/catch para tratar erros
    try {
      // Limpa qualquer erro anterior
      setErro(null);

      // Calcula o mês com base na data do gasto em edição
      // Se por algum motivo não houver data, mantemos o mes já existente
      const mesDaData =
        gastoEditando.data.trim().length > 0
          ? String(new Date(gastoEditando.data).getMonth() + 1)
          : gastoEditando.mes;

      // Monta o payload com as informações atualizadas do gasto
      const payloadAtualizado = {
        ...gastoEditando,   // Copia todos os campos do gasto em edição
        mes: mesDaData,     // Atualiza o campo mes com base na data
      };

      // Faz a requisição PUT para atualizar o registro na API
      const resposta = await fetch(`${API_URL}/${gastoEditando.id}`, {
        method: "PUT",                             // Método HTTP PUT
        headers: {
          "Content-Type": "application/json",      // Corpo em JSON
        },
        body: JSON.stringify(payloadAtualizado),   // Converte o payload para JSON string
      });

      // Se o status não estiver ok, lançamos um erro
      if (!resposta.ok) {
        throw new Error("Erro ao atualizar gasto");
      }

      // Converte a resposta para um objeto Gasto atualizado
      const gastoAtualizado: Gasto = await resposta.json();

      // Atualiza a lista de gastos exibida, de acordo com o mês
      // Se o gasto continuar no mesmo mês selecionado:
      if (gastoAtualizado.mes === mesSelecionado) {
        // Substitui o gasto antigo pelo gasto atual em "gastos"
        setGastos((estadoAnterior) =>
          estadoAnterior.map((gasto) =>
            gasto.id === gastoAtualizado.id ? gastoAtualizado : gasto
          )
        );
      } else {
        // Se o gasto mudou de mês, removemos ele da lista do mês atual
        setGastos((estadoAnterior) =>
          estadoAnterior.filter((gasto) => gasto.id !== gastoAtualizado.id)
        );
      }

      // Sai do modo de edição
      setGastoEditando(null);
    } catch (erroCapturado) {
      // Em caso de erro, guardamos a mensagem para exibir
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao atualizar gasto";
      setErro(mensagem);
    }
  }

  // Handler para excluir (DELETE) um gasto pelo id
  async function handleExcluirGasto(id: number) {
    // Envolvemos a lógica em try/catch para tratar erros
    try {
      // Limpa erros anteriores
      setErro(null);

      // Faz a requisição DELETE na API, passando o id do gasto
      const resposta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",   // Método HTTP DELETE
      });

      // Se a resposta não for ok, lançamos um erro
      if (!resposta.ok) {
        throw new Error("Erro ao excluir gasto");
      }

      // Remove o gasto excluído da lista de "gastos" em memória
      setGastos((estadoAnterior) =>
        estadoAnterior.filter((gasto) => gasto.id !== id)
      );

      // Se o gasto que foi excluído era o que estava em edição, limpamos o estado de edição
      if (gastoEditando && gastoEditando.id === id) {
        setGastoEditando(null);
      }
    } catch (erroCapturado) {
      // Se ocorrer erro, guardamos a mensagem
      const mensagem =
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro desconhecido ao excluir gasto";
      setErro(mensagem);
    }
  }

  // Função auxiliar para pegar o rótulo (nome) de um mês a partir do valor
  function obterRotuloMes(valorMes: string): string {
    // Procura na lista MESES o item cujo valor casa com o valorMes
    const encontrado = MESES.find((mes) => mes.valor === valorMes);
    // Se encontrar, retorna o rótulo; senão, retorna um texto padrão
    return encontrado ? encontrado.rotulo : `Mês ${valorMes}`;
  }

  // Retorno JSX do componente App: estrutura visual da tela
  return (
    // Div raiz que envolve toda a aplicação
    <div
      style={{
        display: "flex",          // Usa flexbox para organizar sidebar e conteúdo lado a lado
        minHeight: "100vh",       // Faz a altura mínima ocupar a tela toda
        fontFamily: "sans-serif", // Define uma fonte simples e legível
      }}
    >
      <CarregandoModal open={carregando} message="Carregando dados..." />
      {/* Sidebar com a lista de meses */}
      <aside
        style={{
          width: "220px",                 // Largura fixa da sidebar
          backgroundColor: "#f5f5f5",     // Cor de fundo levemente cinza
          padding: "16px",                // Espaçamento interno
          borderRight: "1px solid #ddd",  // Uma borda à direita para separar do conteúdo
        }}
      >
        {/* Título da sidebar */}
        <h2
          style={{
            marginBottom: "12px", // Espaçamento abaixo do título
            fontSize: "18px",     // Tamanho da fonte um pouco maior
          }}
        >
          Meses
        </h2>

        {/* Lista de meses como uma lista não ordenada */}
        <ul
          style={{
            listStyle: "none",   // Remove os bullets padrão da lista
            padding: 0,          // Remove padding padrão
            margin: 0,           // Remove margin padrão
          }}
        >
          {/* Percorre o array MESES e renderiza um <li> para cada mês */}
          {MESES.map((mes) => (
            // Cada item da lista precisa de uma key única
            <li key={mes.valor} style={{ marginBottom: "8px" }}>
              {/* Botão que, ao ser clicado, seleciona o mês correspondente */}
              <button
                type="button"                          // Define o tipo do botão como "button"
                onClick={() => handleSelecionarMes(mes.valor)} // Handler para atualizar o mês selecionado
                style={{
                  width: "100%",                       // Botão ocupa a largura toda da sidebar
                  padding: "8px 12px",                 // Espaçamento interno
                  borderRadius: "4px",                 // Bordas levemente arredondadas
                  border:
                    mesSelecionado === mes.valor       // Se o mês estiver selecionado...
                      ? "2px solid #1976d2"            // ...borda azul mais grossa
                      : "1px solid #ccc",              // Senão, borda cinza mais fina
                  backgroundColor:
                    mesSelecionado === mes.valor       // Se o mês estiver selecionado...
                      ? "#e3f2fd"                      // ...fundo azul clarinho
                      : "#ffffff",                     // Senão, fundo branco
                  cursor: "pointer",                   // Cursor de mão ao passar o mouse
                  textAlign: "left",                   // Alinha o texto à esquerda
                }}
              >
                {/* Texto do botão: rótulo do mês */}
                {mes.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Área principal, onde aparecem os gastos e o formulário */}
      <main
        style={{
          flex: 1,                  // Ocupa todo o espaço restante ao lado da sidebar
          padding: "24px",          // Espaçamento interno generoso
          backgroundColor: "#fff",  // Fundo branco
        }}
      >
        {/* Cabeçalho da área principal, com o título do mês selecionado */}
        <header
          style={{
            marginBottom: "24px", // Espaçamento abaixo do cabeçalho
          }}
        >
          {/* Título principal com o nome do mês selecionado */}
          <h1
            style={{
              fontSize: "24px",   // Tamanho grande de fonte
              marginBottom: "8px" // Espaço abaixo do título
            }}
          >
            Gastos do mês de {obterRotuloMes(mesSelecionado)}
          </h1>

          {/* Texto auxiliar explicando o que a tela faz */}
          <p
            style={{
              margin: 0,          // Sem margem extra
              color: "#555",      // Cor de texto mais suave
              fontSize: "14px",   // Fonte um pouco menor
            }}
          >
            Aqui tu enxerga, adiciona, edita e exclui gastos do mês selecionado.
          </p>
        </header>

        {/* Se houver mensagem de erro, exibimos em destaque */}
        {erro && (
          <div
            style={{
              marginBottom: "16px",    // Espaço abaixo da mensagem
              padding: "8px 12px",     // Espaçamento interno
              borderRadius: "4px",     // Bordas levemente arredondadas
              backgroundColor: "#ffebee", // Fundo vermelho claro
              color: "#c62828",        // Texto vermelho escuro
              border: "1px solid #ef9a9a", // Borda combinando com o fundo
            }}
          >
            {erro}
          </div>
        )}

        {/* Indica visualmente quando estamos carregando dados da API */}
        {/* Se não estiver carregando e não houver gastos, mostra um recado */}
        {!carregando && gastos.length === 0 && (
          <p
            style={{
              marginBottom: "16px", // Espaço abaixo
              color: "#777",        // Cor mais suave
            }}
          >
            Nenhum gasto cadastrado para este mês ainda.
          </p>
        )}

        {/* Lista de gastos para o mês selecionado */}
        <section
          style={{
            marginBottom: "32px",  // Espaço abaixo da seção de lista
          }}
        >
          {/* Subtítulo da seção de lista */}
          <h2
            style={{
              fontSize: "18px",   // Tamanho de fonte moderado
              marginBottom: "12px", // Espaço abaixo do subtítulo
            }}
          >
            Lista de gastos
          </h2>

          {/* Lista não ordenada com todos os gastos */}
          <ul
            style={{
              listStyle: "none", // Remove bullets padrão
              padding: 0,        // Remove padding padrão
              margin: 0,         // Remove margin padrão
            }}
          >
            {/* Percorre o array "gastos" e renderiza um item para cada gasto */}
            {gastos.map((gasto) => {
              // Verifica se este gasto específico está em modo de edição
              const estaEditando = gastoEditando?.id === gasto.id;

              // Retorna o <li> correspondente ao gasto
              return (
                <li
                  key={gasto.id} // key única para o React identificar o item
                  style={{
                    border: "1px solid #ddd",    // Borda em volta do item
                    borderRadius: "4px",        // Bordas levemente arredondadas
                    padding: "12px",            // Espaçamento interno
                    marginBottom: "8px",        // Espaço abaixo de cada item
                    display: "flex",            // Usa flexbox para organizar conteúdo
                    flexDirection: "column",    // Organiza em coluna
                    gap: "8px",                 // Espaçamento entre linhas dentro do item
                  }}
                >
                  {/* Se o gasto está em modo de edição, mostra inputs; senão, mostra texto */}
                  {estaEditando ? (
                    // Bloco de edição do gasto
                    <div
                      style={{
                        display: "flex",        // Usa flex para organizar inputs
                        flexWrap: "wrap",       // Permite quebrar linha quando faltar espaço
                        gap: "8px",             // Espaço entre os campos
                      }}
                    >
                      {/* Input para editar a descrição */}
                      <input
                        type="text"                           // Tipo texto
                        name="descricao"                      // Nome do campo, bate com a chave em Gasto
                        value={gastoEditando?.descricao ?? ""} // Valor atual da descrição
                        onChange={handleChangeGastoEditando}  // Handler para mudanças
                        placeholder="Descrição"               // Placeholder amigável
                        style={{
                          flex: "1 1 150px",                  // Faz o input crescer conforme espaço
                          padding: "4px 8px",                 // Espaço interno
                        }}
                      />

                      {/* Input para editar a categoria */}
                      <input
                        type="text"                           // Tipo texto
                        name="categoria"                      // Nome do campo
                        value={gastoEditando?.categoria ?? ""} // Valor atual da categoria
                        onChange={handleChangeGastoEditando}  // Handler de mudança
                        placeholder="Categoria"              // Placeholder
                        style={{
                          flex: "1 1 150px",                  // Regras de flex semelhantes
                          padding: "4px 8px",                 // Espaço interno
                        }}
                      />

                      {/* Input para editar o valor */}
                      <input
                        type="number"                         // Campo numérico
                        name="valor"                          // Nome do campo
                        value={gastoEditando?.valor ?? 0}     // Valor atual do gasto
                        onChange={handleChangeGastoEditando}  // Handler de mudança
                        placeholder="Valor"                   // Placeholder
                        step="0.01"                           // Permite casas decimais
                        style={{
                          width: "120px",                     // Largura fixa razoável
                          padding: "4px 8px",                 // Espaço interno
                        }}
                      />

                      {/* Input para editar a data */}
                      <input
                        type="date"                           // Tipo data
                        name="data"                           // Nome do campo
                        value={gastoEditando?.data ?? ""}     // Valor atual da data
                        onChange={handleChangeGastoEditando}  // Handler de mudança
                        style={{
                          width: "160px",                     // Largura suficiente para a data
                          padding: "4px 8px",                 // Espaço interno
                        }}
                      />
                    </div>
                  ) : (
                    // Bloco de visualização normal do gasto (sem edição)
                    <div
                      style={{
                        display: "flex",           // Usa flexbox
                        justifyContent: "space-between", // Espaça os lados
                        gap: "8px",               // Espaço entre as colunas
                        flexWrap: "wrap",         // Permite quebrar linha
                      }}
                    >
                      {/* Coluna esquerda com descrição e categoria */}
                      <div>
                        {/* Descrição em destaque */}
                        <strong>{gasto.descricao}</strong>
                        {/* Categoria em texto menor logo abaixo */}
                        <div
                          style={{
                            fontSize: "12px", // Fonte menor
                            color: "#555",    // Cor mais suave
                          }}
                        >
                          {gasto.categoria}
                        </div>
                      </div>

                      {/* Coluna direita com valor e data */}
                      <div
                        style={{
                          textAlign: "right", // Alinha conteúdos à direita
                        }}
                      >
                        {/* Valor formatado como moeda simples (sem formatação internacional aqui) */}
                        <div>
                          R$ {gasto.valor.toFixed(2)}
                        </div>

                        {/* Data do gasto em fonte menor */}
                        <div
                          style={{
                            fontSize: "12px", // Fonte menor
                            color: "#555",    // Cor suavizada
                          }}
                        >
                          {gasto.data}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de botões de ação (Editar, Salvar, Cancelar, Excluir) */}
                  <div
                    style={{
                      display: "flex",             // Usa flexbox
                      gap: "8px",                  // Espaçamento entre os botões
                      justifyContent: "flex-end",  // Alinha botões à direita
                    }}
                  >
                    {/* Se estiver em modo de edição, mostra botões "Salvar" e "Cancelar" */}
                    {estaEditando ? (
                      <>
                        {/* Botão para salvar a edição */}
                        <button
                          type="button"            // Tipo button para não submeter form
                          onClick={handleSalvarEdicao} // Handler que faz o PUT na API
                          style={{
                            padding: "4px 8px",   // Espaço interno
                            borderRadius: "4px",  // Borda arredondada
                            border: "1px solid #1976d2", // Borda azul
                            backgroundColor: "#1976d2",  // Fundo azul
                            color: "#fff",        // Texto branco
                            cursor: "pointer",    // Cursor de mão
                          }}
                        >
                          Salvar
                        </button>

                        {/* Botão para cancelar a edição e voltar ao modo normal */}
                        <button
                          type="button"            // Tipo button
                          onClick={() => setGastoEditando(null)} // Limpa o estado de edição
                          style={{
                            padding: "4px 8px",   // Espaço interno
                            borderRadius: "4px",  // Borda arredondada
                            border: "1px solid #ccc", // Borda cinza
                            backgroundColor: "#fff", // Fundo branco
                            cursor: "pointer",    // Cursor de mão
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      // Se não estiver em edição, mostra o botão "Editar"
                      <button
                        type="button"              // Tipo button
                        onClick={() => handleIniciarEdicao(gasto)} // Inicia modo edição
                        style={{
                          padding: "4px 8px",     // Espaço interno
                          borderRadius: "4px",    // Borda arredondada
                          border: "1px solid #1976d2", // Borda azul
                          backgroundColor: "#fff", // Fundo branco
                          color: "#1976d2",       // Texto azul
                          cursor: "pointer",      // Cursor de mão
                        }}
                      >
                        Editar
                      </button>
                    )}

                    {/* Botão para excluir o gasto, sempre visível */}
                    <button
                      type="button"                // Tipo button
                      onClick={() => handleExcluirGasto(gasto.id)} // Chama o DELETE na API
                      style={{
                        padding: "4px 8px",       // Espaço interno
                        borderRadius: "4px",      // Borda arredondada
                        border: "1px solid #d32f2f", // Borda vermelha
                        backgroundColor: "#fff",  // Fundo branco
                        color: "#d32f2f",         // Texto vermelho
                        cursor: "pointer",        // Cursor de mão
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção com o formulário para adicionar um novo gasto */}
        <section>
          {/* Subtítulo da seção de criação de gastos */}
          <h2
            style={{
              fontSize: "18px",   // Tamanho de fonte
              marginBottom: "12px", // Espaço abaixo do título
            }}
          >
            Adicionar novo gasto
          </h2>

          {/* Formulário controlado para criação de novo gasto */}
          <form
            onSubmit={handleSubmitNovoGasto} // Handler que executa o POST na API
            style={{
              display: "flex",      // Usa flexbox
              flexWrap: "wrap",     // Permite quebrar linha
              gap: "8px",           // Espaço entre campos
              alignItems: "center", // Alinha verticalmente
            }}
          >
            {/* Campo de descrição do novo gasto */}
            <input
              type="text"                          // Tipo texto
              name="descricao"                     // Nome do campo, bate com NovoGasto.descricao
              value={novoGasto.descricao}          // Valor atual do estado
              onChange={handleChangeNovoGasto}     // Handler para mudanças
              placeholder="Descrição"              // Placeholder
              required                             // Torna o campo obrigatório
              style={{
                flex: "2 1 200px",                 // Faz o input crescer mais na linha
                padding: "4px 8px",                // Espaço interno
              }}
            />

            {/* Campo de categoria do novo gasto */}
            <input
              type="text"                          // Tipo texto
              name="categoria"                     // Nome do campo
              value={novoGasto.categoria}          // Valor atual do estado
              onChange={handleChangeNovoGasto}     // Handler de mudanças
              placeholder="Categoria"              // Placeholder
              required                             // Campo obrigatório
              style={{
                flex: "1 1 160px",                 // Regras de flex
                padding: "4px 8px",                // Espaço interno
              }}
            />

            {/* Campo de valor do novo gasto */}
            <input
              type="number"                        // Campo numérico
              name="valor"                         // Nome do campo
              onChange={handleChangeNovoGasto}     // Handler de mudanças
              placeholder="Valor"                  // Placeholder
              step="0.01"                          // Permite casas decimais
              required                             // Campo obrigatório
              style={{
                width: "120px",                    // Largura fixa
                padding: "4px 8px",
                                // Espaço interno
              }}
            />

            {/* Campo de data do novo gasto */}
            <input
              type="date"                          // Tipo data
              name="data"                          // Nome do campo
              value={novoGasto.data}               // Valor atual do estado
              onChange={handleChangeNovoGasto}     // Handler de mudanças
              required                             // Campo obrigatório
              style={{
                width: "160px",                    // Largura fixa
                padding: "4px 8px",                // Espaço interno
              }}
            />

            {/* Botão de envio do formulário (criar novo gasto) */}
            <button
              type="submit"                        // Tipo submit, dispara onSubmit do form
              style={{
                padding: "6px 12px",               // Espaço interno
                borderRadius: "4px",               // Bordas arredondadas
                border: "1px solid #2e7d32",       // Borda verde
                backgroundColor: "#2e7d32",        // Fundo verde
                color: "#fff",                     // Texto branco
                cursor: "pointer",                 // Cursor de mão
              }}
            >
              Adicionar
            </button>
          </form>

          <div
            style={{
              marginTop: "80px", 
              fontSize: "12px", 
              color: "#555",  
              width: "100%",
              height: "50px"
            }}
          >

            <Link to="/resumo-anual" style={{ textDecoration: "none", color: "#202020ff", fontSize: "20px", border: "1px solid #202020ff", borderRadius:"5px" , padding: "10px" }}>
              Ver Resumo Anual →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

// Exporta o componente App como padrão, para ser usado em main.tsx
export default App;
