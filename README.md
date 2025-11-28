# 💰 Controle de Despesas Pessoais (React + TypeScript)

Aplicação web para **gestão de despesas pessoais**, permitindo **Criar – Listar – Editar – Excluir** gastos ao longo do mês.  
O projeto foi desenvolvido utilizando **React + TypeScript** e um **backend fake com JSON Server**, como parte da disciplina **Tópicos Especiais em Tecnologias Digitais** do curso de **Tecnologias da Informação e Comunicação (TIC) – UFSC (Campus Araranguá)**.

---

## 📌 Objetivo

Oferecer uma interface simples e intuitiva para organizar as finanças pessoais, praticando conceitos de:

- Desenvolvimento web com **React** e **TypeScript**
- Consumo de APIs REST (HTTP GET/POST/PUT/DELETE)
- Organização de componentes e Estado
- Integração com **JSON Server** como API fake

---

## ⚙️ Funcionalidades

- ✅ Cadastro de despesas com:
  - Categoria (alimentação, transporte, lazer, etc.)
  - Valor
  - Data
  - Descrição
- 📋 Listagem de todas as despesas registradas
- ✏️ Edição de despesas existentes
- 🗑️ Exclusão de despesas
- 📆 Filtro por período (ex.: mês atual)
- 📊 Cálculo de total de gastos (por lista/por período)
- 💾 Persistência via **JSON Server** (fake backend)

---

## 🧱 Tecnologias Utilizadas

- **React** (com Vite)
- **TypeScript**
- **CSS**
- **JSON Server** (API fake)
- **Axios** ou `fetch` para chamadas HTTP (dependendo da implementação)

---

## 📁 Estrutura (visão geral)

```text
despesasPessoais-react/
├─ api/              # Backend fake com JSON Server (db.json, scripts, etc.)
├─ public/           # Arquivos públicos
├─ src/              # Código fonte React + TypeScript
│  ├─ components/    # Componentes reutilizáveis
│  ├─ pages/         # Páginas principais da aplicação
│  ├─ services/      # Serviços de API (requisições HTTP)
│  └─ ...           
├─ package.json
└─ vite.config.ts
```
## 🚀 Como rodar o projeto (passo a passo)
  ✅ Pré-requisitos
---

Antes de começar, é importante ter instalado:
Node.js
Gerenciador de pacotes npm (já vem com o Node - instalação extra)

---

- 1️⃣ Clonar o repositório
  - Abra um terminal.
  - Execute: git clone https://github.com/MateusZeferino/despesasPessoais-react.git

- 2️⃣ Instalar as dependências do front-end
  - Na raiz do projeto (despesasPessoais-react), rode: npm install

- 3️⃣ Configurar e subir o backend fake (JSON Server)
  - No mesmo terminal ou em um novo, entre na pasta api: cd api
  - instalar dependencias do backend: npm install
  - Inicie o json server na porta definida (meu caso 3001) para ficar "olhando" o arquivo db.json: npx json-server --watch db.json --port 3001
  - Rode o servidor backend - Dentro de api/ abra um shell e rode: npm run server
  - Verificar se o servidor json está funcionando - abra o navegador e acesse: http://localhost:3001

    !!! Mantenha o servidor json rodando pois a aplicação precisa dele para funcionar !!!

- 4️⃣ Rodar a aplicação React (Vite)
  - Abra outro terminal.
  - Vá para a raiz do projeto (se ainda estiver dentro de api): cd ..
  - Abra outro shell e rode: npm run dev
  - O terminal vai mostrar um endereço parecido com isso: http://localhost:5173
  - Abra esse endereço no navegador.

- 👨‍💻 Autor
  - Desenvolvido por Mateus Zeferino com apoio de IA (OpenAI Codex).
  - Projeto acadêmico da disciplina de Tópicos Especiais em Tecnologias Especiais do curso de Tecnologias da Informação e Comunicação (TIC) – UFSC/Campus Araranguá.


  
