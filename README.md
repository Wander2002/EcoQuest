# EcoQuest — Sistema de Gamificação da Sustentabilidade

## 🎯 Introdução
O EcoQuest é um **Sistema de Gamificação** projetado para aplicar elementos e mecânicas de jogos (como progressão, recompensas e desafios) em um contexto não-jogo, visando motivar e engajar usuários em **ações sustentáveis no mundo real**. O sistema transforma a jornada ecológica do usuário em uma experiência de evolução de personagem, onde cada ação positiva contribui para o progresso virtual e o combate a problemas ambientais.

## 🚀 Objetivo
Incentivar ações sustentáveis na vida real por meio de um sistema de gamificação, onde os usuários evoluem seus personagens e combatem vilões ambientais através de ações ecológicas.

## 🎮 Funcionalidades Principais
✅ Tela de login e cadastro de usuário.
<br>✅ Criação de personagem estilo Guardião do Planeta.
<br>✅ Sistema de ações ecológicas.
<br>✅ Sistema de Sequência de dias
<br>✅ Combate contra vilões ambientais.
<br>✅ Sistema de eventos.
<br>✅ Sistema de Ranking Global.

## 📜 Requisitos

### ✅ Requisitos Funcionais (RF)
RF001 — Cadastro e autenticação de usuários (Login e Cadastro).
<br>RF002 — Criação e personalização do personagem.
<br>RF003 — Listagem e execução de quests sustentáveis.
<br>RF004 — Sistema de evolução de níveis.
<br>RF005 — Sistema de combate contra vilões ambientais.
<br>RF006 — Visualização de mapa colaborativo de pontos sustentáveis.
<br>RF007 — Ranking e conquistas.

### ⚙️ Requisitos Não Funcionais (RNF)
RNF001 — Interface responsiva (web).
<br>RNF002 — Banco de dados escalável.
<br>RNF003 — Tempo de resposta inferior a 3 segundos.
<br>RNF004 — Segurança dos dados dos usuários.
<br>RNF005 — Design intuitivo e acessível.
<br>RNF006 — Suporte multiplataforma (Web).

## 🛠️ Tecnologias
<br>🟨 Linguagem: **JavaScript**  
<br>⚛️ Framework/Biblioteca: **React**  
<br>🔥 Backend & Banco de Dados: **Firebase**  
<br>🎨 Estilização: **CSS**

## 🧠 Metodologia
🎯 Metodologia: **Kanban**
<br>📋 Ferramenta: **Trello**
<br>🔁 Entregas incrementais com sprints semanais

## 🗺️ Estrutura do Projeto

```
ecoquest/
├── public/             
├── src/                # Código-fonte da aplicação
│   ├── assets/         # Ativos estáticos como imagens e ícones
│   ├── components/     # Componentes React
│   │   └── ui/         # Componentes de UI
│   ├── hooks/          # Hooks React
│   ├── lib/            # Funções e configurações
│   ├── services/       # Serviços de API e lógica de negócio (Firebase)
│   ├── App.jsx         # Componente principal da aplicação e roteamento
│   ├── App.css         # Estilos globais e específicos do App
│   ├── firebase.js     # Configuração e inicialização do Firebase
│   ├── firebaseConfig.js # Chaves e configurações específicas do Firebase
│   ├── index.css       # Estilos CSS
│   └── main.jsx        # Ponto de entrada da aplicação React
├── package.json        # Dependências
├── vite.config.js      # Configuração do Vite
├── components.json     # Configuração do shadcn/ui
├── eslint.config.js    # Configuração do ESLint
├── jsconfig.json       # Configuração do JavaScript
├── index.html          # Template HTML
├── package-lock.json   # Dependências npm
└── pnpm-lock.yaml      # Dependências pnpm
```

## 🔗 Acesso ao Projeto

Acesse a versão online do projeto pelo link abaixo:

**[Acessar Aplicação](https://eco-quest-eight.vercel.app)**

### Credenciais para Teste

Use o usuário e senha abaixo para testar a aplicação:

- **Usuário:** `wanderhanemann@gmail.com`
- **Senha:** `123456`

## 🎬 Vídeo de apresentação

Você pode assistir ao vídeo demonstrativo do EcoQuest clicando no 
[link](https://youtu.be/CyBuZCS-UFY)


## 💡 Trabalhos Futuros

O EcoQuest, em sua versão MVP, estabeleceu a base para um sistema de gamificação robusto. Para a próxima fase de desenvolvimento, o foco será na expansão da profundidade da jogabilidade, no engajamento social e na análise de impacto.

### 1. Expansão do Sistema de Eventos

O sistema de eventos atual é bem simples e cobre só o básico. Na próxima versão, a ideia é evoluir isso para algo mais dinâmico e envolvente, trazendo mais flexibilidade e variedade nas interações.

- **Eventos Recorrentes e Temáticos:** Implementação de eventos sazonais (ex: "Mês da Reciclagem", "Semana da Água") com duração limitada, que oferecem missões exclusivas, recompensas raras e um conhecimento específico.
- **Mecânicas de Evento Únicas:** Introdução de mecânicas de jogo específicas para eventos, como *mini-games* ou desafios de tempo real, que exigem a colaboração ou competição entre os usuários.
- **🏅 Integração com Gamificação:** As ONGs poderão configurar quais recompensas, pontos ou conquistas serão atribuídos ao usuário ao participar ou finalizar um evento, tornando cada experiência mais motivadora.

### 2. Engajamento Social e Colaborativo

Aumentar a interação entre os usuários para fortalecer a comunidade e o impacto coletivo:

- **Desafios Colaborativos e Guildas:** Implementar um sistema de "Guildas" ou "Equipes" onde os usuários podem se unir para completar metas ambientais maiores, desbloqueando bônus e recompensas de grupo. Isso incentivará a responsabilidade mútua e o senso de pertencimento.
- **Integração Avançada com Redes Sociais:** Permitir que os usuários compartilhem automaticamente suas conquistas, o impacto ambiental acumulado (ex: CO2 evitado) e o progresso em missões específicas em plataformas como Instagram e X (Twitter), com gráficos gerados automaticamente para maior visibilidade.

### 3. Análise de Dados e Dashboards de Impacto

Aprimorar a visualização de dados para reforçar o *feedback loop* positivo e a transparência do impacto:

- **Dashboards de Progresso Detalhados:** Criação de painéis de controle personalizados para o jogador, exibindo métricas detalhadas de seu progresso (nível, experiência, itens) e, mais importante, o impacto ambiental quantificado (ex: litros de água economizados, redução de emissão de carbono).
- **Ranking Global Aprimorado:** Implementação de filtros e categorias no ranking (ex: por região, por tipo de ação, por guilda) para aumentar a competitividade saudável e o reconhecimento.

## 🧑‍💻 Desenvolvido por

**Wander Jean Hanemann**
<br>Email: **wander.hanemann@catolicasc.edu.br**
<br>Instituição: **Católica de Santa Catarina**
<br>Curso: **Engenharia de Software**
