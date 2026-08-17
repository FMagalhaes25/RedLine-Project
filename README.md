<div align="center">
  <img width="1200" height="475" alt="RedLine Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🎯 RedLine
  
  **Seu assistente de produtividade**
  
  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

---

## 📋 Sobre o Projeto

**RedLine** é uma plataforma inovadora de produtividade que combina IA generativa com um conjunto completo de ferramentas para gerenciar tarefas, rastrear hábitos, manter o foco e organizar sua vida profissional.
oferece
### ✨ Recursos Principais

- 🎯 **Listas de Tarefas Inteligentes** - Organize suas prioridades
- 🧠 **Brain Dump** - Capture ideias rapidamente
- ⏱️ **Focus Timer** - Técnica Pomodoro integrada com ambientação sonora
- 📊 **Rastreador de Hábitos** - Visualize seu progresso diário
- 📅 **Visualização de Calendário** - Gerencie seus compromissos
- 🎬 **Briefing de Missão** - Resumo diário de objetivos
- 📱 **Extensão de Navegador** - Acesse de qualquer abinha

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - UI moderna e responsiva
- **TypeScript** - Type-safe development
- **Vite** - Build rápido e otimizado
- **Tailwind CSS** - Estilização utilitária
- **Lucide React** - Ícones elegantes
- **Motion** - Animações suaves

### Backend & Serviços
- **Supabase** - Backend serverless
- **
### DevTools
- **Node.js + npm** - Gerenciador de pacotes
- **TSX** - Execução de TypeScript
- **Autoprefixer** - Compatibilidade CSS

---

## 🚀 Começando

### Pré-requisitos
- **Node.js** 16+ instalado
- **npm** ou **yarn**
- Conta **Supabase**

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <seu-repo>
   cd RedLine
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
**Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   
   A aplicação estará disponível em `http://localhost:3000`

---

## 📦 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Constrói para produção
npm run preview      # Visualiza build de produção
npm run lint         # Verifica tipos TypeScript
npm run clean        # Limpa pasta dist
npm extension:config # Gera configuração da extensão
```

---

## 📂 Estrutura do Projeto

```
RedLine/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   ├── contexts/          # Contextos React (Auth, etc)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários e configurações
│   ├── pages/             # Páginas da aplicação
│   └── App.tsx            # Componente raiz
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Migrações do banco
├── browser-extension/     # Código da extensão
├── public/                # Arquivos estáticos
└── package.json           # Dependências do projeto
```

---

## 🎨 Funcionalidades por Página

| Página | Descrição | Ícone |
|--------|-----------|-------|
| **Dashboard** | Visão geral de tarefas e progresso | 📊 |
| **Focus** | Timer com ambientação sonora | ⏱️ |
| **Calendar** | Calendário de eventos | 📅 |
| **Profile** | Gerenciamento de perfil | 👤 |
| **Privacy** | Políticas de privacidade | 🔒 |

---

## 🚧 Roadmap (Em Desenvolvimento)

- 📊 **Análise Avançada** - Relatórios de produtividade
- 🤖 **Automações IA** - Sugestões inteligentes de tarefas
- 📱 **App Mobile** - Versão nativa para iOS e Android
- 
---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---
