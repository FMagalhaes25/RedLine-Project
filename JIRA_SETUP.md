# Jira Integration Setup

Esta integração foi implementada em modo de leitura segura.

O frontend nunca recebe token do Jira. O app chama uma Supabase Edge Function chamada `jira-dashboard`, e essa função consulta o Jira no servidor usando secrets.

## O que já existe no código

- Página Jira no app para visualizar:
  - issues do dia
  - sprint ativa
  - atrasadas
  - fila completa atribuída ao usuário
- Hook cliente que chama `supabase.functions.invoke('jira-dashboard')`
- Edge Function em `supabase/functions/jira-dashboard/index.ts`

## Pré-requisitos

1. Um projeto Supabase já conectado ao RedLine.
2. Uma conta de serviço no Jira com permissão de leitura das issues e busca de usuários.
3. O email do usuário no RedLine deve existir no Jira.

## Passo 1: criar token no Jira

1. Entre na conta Atlassian que será usada como conta de serviço.
2. Gere um API token em https://id.atlassian.com/manage-profile/security/api-tokens.
3. Guarde:
   - URL base do Jira, ex: `https://suaempresa.atlassian.net`
   - email da conta de serviço
   - API token

## Passo 2: instalar Supabase CLI

Se ainda não tiver:

```bash
npm install -g supabase
```

## Passo 3: logar e linkar o projeto

No diretório do projeto:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

## Passo 4: subir as secrets da função

```bash
supabase secrets set JIRA_BASE_URL=https://suaempresa.atlassian.net
supabase secrets set JIRA_API_EMAIL=conta.servico@suaempresa.com
supabase secrets set JIRA_API_TOKEN=seu_token_aqui
```

## Passo 5: deploy da Edge Function

```bash
supabase functions deploy jira-dashboard
```

## Passo 6: testar localmente o app

O frontend continua sendo iniciado normalmente:

```bash
npm run dev
```

Com o usuário autenticado no RedLine, abra a nova página Jira no app.

## Passo 7: se a função não mapear o usuário

O MVP atual tenta localizar o usuário do Jira pelo email do usuário autenticado no RedLine.

Se isso falhar, normalmente é por um destes motivos:

1. O email do Supabase não existe no Jira.
2. A conta de serviço não tem permissão para busca de usuários.
3. A política de privacidade do Atlassian impede retorno de email.

Nesse caso, o próximo ajuste recomendado é criar um mapeamento explícito `redline_user_id -> jira_account_id` em tabela própria no Supabase.

## Segurança adotada

1. Nenhum token do Jira é exposto no navegador.
2. Toda consulta passa por usuário autenticado no Supabase.
3. A função retorna somente dados necessários para renderização.
4. Não há alteração de status nem escrita no Jira nesta fase.

## Próxima evolução recomendada

1. Cache curto no Supabase para reduzir chamadas ao Jira.
2. Tabela de mapeamento entre usuário RedLine e `jira_account_id`.
3. Filtro por projeto, sprint e prioridade.
4. Vincular sessões de foco do RedLine a uma issue do Jira.