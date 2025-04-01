# Nmalls - Sistema Interno

Sistema interno de gestão desenvolvido para a Nmalls, focado em gerenciamento de entregas, rastreamento de motoristas e controle de devoluções.

## Visão Geral

O sistema Nmalls é uma aplicação web e mobile (híbrida) desenvolvida com Next.js que permite:

- Gerenciar rotas de entrega
- Rastrear motoristas em tempo real
- Processar devoluções de produtos
- Gerenciar usuários com diferentes níveis de permissão

## Tecnologias Utilizadas

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: TailwindCSS

## Estrutura do Projeto

```
src/
├── app/                   # Rotas da aplicação (App Router)
│   ├── api/               # API Routes do Next.js
│   ├── dashboard/         # Páginas do painel administrativo
│   │   ├── entregas/      # Páginas de gestão de entregas
│   │   ├── devolucoes/    # Páginas de gestão de devoluções
│   │   └── usuarios/      # Páginas de gestão de usuários
│   ├── login/             # Página de login
│   └── register/          # Página de registro
├── components/            # Componentes reutilizáveis
├── contexts/              # Contextos do React
├── hooks/                 # Hooks personalizados
├── lib/                   # Bibliotecas e configurações
│   ├── supabase.ts        # Cliente Supabase
├── types/                 # Definições de tipos
└── utils/                 # Funções utilitárias
```

## Funcionalidades

### Entregas

- Criação e gerenciamento de rotas de entrega
- Atribuição de rotas a motoristas
- Acompanhamento de status de entregas
- Visualização de histórico de entregas

### Rastreamento

- Visualização em tempo real da localização dos motoristas
- Acompanhamento de rotas em andamento
- Estimativa de tempo para próximas entregas

### Devoluções

- Registro de produtos devolvidos com fotos
- Workflow de processamento de devoluções
- Atribuição de responsáveis para análise
- Acompanhamento de status de devoluções

## Níveis de Permissão

- **Admin**: Acesso completo a todas as funcionalidades do sistema
- **Gerente**: Acesso a gerenciamento de entregas, devoluções e visualização de logs
- **Operador**: Acesso a registro de devoluções e visualização de entregas
- **Motorista**: Acesso apenas às suas rotas e entregas

## Configuração do Banco de Dados

O projeto utiliza Supabase como backend. As principais tabelas são:

- `users`: Usuários do sistema e suas permissões
- `rotas`: Rotas de entrega
- `produtos_rota`: Produtos incluídos em cada rota
- `motoristas`: Informações de motoristas
- `devolucoes`: Registros de devoluções
- `devolucoes_fotos`: Fotos anexadas a cada devolução
- `logs`: Registro de atividades dos usuários

## Executando o Projeto Localmente

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure as variáveis de ambiente em um arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rnqdwjslfoxtdchxzgfr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Execute o servidor de desenvolvimento:
   ```
   npm run dev
   ```
5. Acesse `http://localhost:3000`

## Preparando para Produção

Para construir o aplicativo para produção:

```
npm run build
```

Para dispositivos móveis, o projeto pode ser empacotado com Capacitor para gerar aplicativos nativos para iOS e Android.

## Próximos Passos

- Implementação de notificações em tempo real
- Integração com serviços de mapas para rastreamento mais preciso
- Desenvolvimento de dashboard analítico com métricas de desempenho
- Implementação de sistema de chat entre operadores e motoristas 