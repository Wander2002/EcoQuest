# 🌍 EcoQuest — RPG da Sustentabilidade

O **EcoQuest** é um jogo no estilo RPG que conecta ações sustentáveis do mundo real com progressão e recompensas no mundo virtual. O jogador assume o papel de um **Guardião do Planeta**, enfrentando vilões ambientais através de ações ecológicas, como reciclagem, economia de água, plantio de árvores e combate ao desperdício.

---

## 🚀 Objetivo

Incentivar ações sustentáveis na vida real por meio de um RPG, onde os jogadores evoluem seus personagens e combatem vilões ambientais através de missões ecológicas.

---

## 🎮 Funcionalidades Principais

- ✅ Tela de login e cadastro de usuário.
- ✅ Criação de personagem estilo Guardião do Planeta.
- ✅ Sistema de quests diárias e semanais com desafios sustentáveis.
- ✅ Combate simbólico contra vilões ambientais (poluição, desperdício, desmatamento, etc.).
- ✅ Evolução de atributos baseados em ações reais.
- ✅ Mapa colaborativo com pontos de coleta, feiras ecológicas e eventos verdes.
- ✅ Sistema de ranking e conquistas.
- ✅ Loja de itens para personalização sustentável do avatar.

---

## 🖥️ Tela de Login e Cadastro

### 📲 **Descrição**
A tela de **Login e Cadastro** permite que os usuários acessem o jogo de forma segura, utilizando email e senha. Após o login ou cadastro, o usuário é direcionado à criação do personagem e, em seguida, ao ambiente de jogo.

### 🔑 **Funcionalidades**
- ✅ Cadastro de novos usuários com email e senha.
- ✅ Login de usuários existentes.
- 🔒 Recuperação de senha via email.
- 🔐 Autenticação segura integrada com Firebase Authentication.

### 🧩 **Componentes**
- Campo de email
- Campo de senha
- Botão **"Entrar"**
- Link **"Não tem uma conta? Cadastre-se"**
- Tela de cadastro:
  - Campo de nome
  - Campo de email
  - Campo de senha
  - Campo de confirmação de senha
  - Botão **"Cadastrar"**
- Link **"Esqueceu sua senha?"** para recuperação.

### 🔄 **Fluxo**
1. O usuário acessa a tela inicial e escolhe **"Entrar"** ou **"Cadastrar"**.
2. Após o cadastro, é redirecionado para criar seu personagem.
3. Após login, o usuário acessa a tela inicial do jogo com quests, mapa e progresso.
4. Caso esqueça a senha, pode solicitar redefinição via email.

---

## 📜 Requisitos

### ✅ Requisitos Funcionais (RF)

- RF001 — Cadastro e autenticação de usuários (Login e Cadastro).
- RF002 — Criação e personalização do personagem.
- RF003 — Listagem e execução de quests sustentáveis.
- RF004 — Sistema de evolução de níveis e atributos.
- RF005 — Sistema de combate contra vilões ambientais.
- RF006 — Visualização de mapa colaborativo de pontos sustentáveis.
- RF007 — Loja de itens e personalização.
- RF008 — Ranking e conquistas por impacto sustentável.

### ⚙️ Requisitos Não Funcionais (RNF)

- RNF001 — Interface responsiva (web e mobile).
- RNF002 — Banco de dados escalável.
- RNF003 — Tempo de resposta inferior a 3 segundos.
- RNF004 — Segurança dos dados dos usuários, especialmente autenticação.
- RNF005 — Design intuitivo e acessível.
- RNF006 — Suporte multiplataforma com Flutter.

---

## 🛠️ Tecnologias

- **Linguagem:** Dart
- **Framework:** Flutter (Web, Mobile e Desktop)
- **Backend & Banco de Dados:** Firebase (Firestore, Authentication, Storage)
- **APIs:** Google Maps API (para mapa colaborativo)
- **Gerenciamento de Estado:** Provider ou Riverpod
- **Outros:** Git, GitHub, Firebase Hosting

---

## 🧠 Metodologia

- 🎯 **Metodologia:** Kanban
- 📋 **Ferramenta:** Trello
- 🔁 Entregas incrementais com sprints semanais
- ✅ Desenvolvimento Orientado a Testes (TDD)

---

## 🗺️ Estrutura do Projeto

```plaintext
lib/
├── models/              # Definição dos modelos e estruturas de dados
├── providers/           # Gerenciamento de estado e lógica de negócios
├── screens/             # Telas principais da aplicação
│   ├── login_screen.dart      # Tela de login
│   ├── register_screen.dart   # Tela de cadastro
│   ├── home_screen.dart       # Tela inicial / dashboard
│   ├── profile_screen.dart    # Tela de perfil do usuário
│   ├── quest_screen.dart      # Tela de missões / desafios
│   ├── combat_screen.dart     # Tela de combate
│   └── map_screen.dart        # Tela de mapa interativo
├── services/            # Serviços externos e autenticação
│   └── auth_service.dart      # Serviço de autenticação
├── widgets/             # Componentes reutilizáveis da interface
└── main.dart            # Arquivo principal de inicialização da aplicação
```
---

## 💡 Trabalhos Futuros

- 🗺️ Integração de mapa colaborativo
- 🎯 Implementar desafios colaborativos entre usuários
- 🌐 Suporte a múltiplos idiomas
- 🏆 Eventos sazonais temáticos (Dia da Terra, Semana do Meio Ambiente, etc.)
- 📱 Integração com redes sociais para divulgação de impacto

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir *issues*, enviar *pull requests* ou sugerir melhorias.

---

## 🧑‍💻 Desenvolvido por

- **Wander Jean Hanemann**  
Email: [wander.hanemann@catolicasc.edu.br](mailto:wander.hanemann@catolicasc.edu.br)  
Instituição: Católica de Santa Catarina  
Curso: Engenharia de Software  

---

## 🌍 Jogue salvando o planeta. Salve o planeta jogando. ♻️
