# auth-react-node-postgres

Sistema de autenticação completo com front-end em React e API em Node.js, usando PostgreSQL.

## Funcionalidades

- Cadastro de usuário e login
- Sessão por cookie `httpOnly` com JWT (validade de 1 dia)
- Painel protegido, que redireciona para o login quando não há sessão válida
- Troca de senha para usuário logado
- Recuperação de senha ("Esqueceu a senha?") por link enviado por e-mail

## Tecnologias

- **Front-end:** React, Vite, React Router, React Hook Form, Zod, Tailwind CSS, shadcn/ui
- **Back-end:** Node.js, Express, Prisma, Zod, argon2, JSON Web Token
- **Banco de dados:** PostgreSQL (via Docker)

## Pré-requisitos

- Node.js 22 ou superior
- Docker e Docker Compose

## Como rodar

### 1. Back-end

```bash
cd back-end
cp .env.example .env
```

Edite o `.env` e preencha os valores. Pontos de atenção:

- `DATABASE_URL` deve usar a mesma porta de `DB_PORT` e as mesmas credenciais de `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
- `FRONTEND_ORIGIN` deve ser a URL do front-end, normalmente `http://localhost:5173`.
- `JWT_TOKEN` deve ser uma chave aleatória. Para gerar uma:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```

Depois:

```bash
npm install
npm run db:up        # sobe o PostgreSQL no Docker
npm run db:migrate   # aplica as migrações e gera o Prisma Client
npm run dev          # inicia a API
```

### 2. Front-end

```bash
cd front-end
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` deve apontar para a API, com a mesma porta de `API_PORT` do back-end.

Abra `http://localhost:5173`.

## Recuperação de senha e e-mail

O envio por SMTP é opcional.

- **Sem SMTP:** o link de redefinição aparece no console do servidor. Copie a URL e abra no navegador. Esse é o modo mais simples para testar.
- **Com SMTP:** preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM` no `.env` do back-end, e o e-mail passa a ser enviado.

O link expira em 15 minutos e só pode ser usado uma vez.

## Rotas da API

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| POST | `/auth/register` | Não | Cria uma conta |
| POST | `/auth/login` | Não | Faz login e define o cookie de sessão |
| POST | `/auth/logout` | Sim | Remove o cookie de sessão |
| GET | `/auth/me` | Sim | Retorna os dados do token |
| POST | `/auth/forgot-password` | Não | Pede o link de redefinição de senha |
| POST | `/auth/reset-password` | Não | Define a nova senha com o token do link |
| GET | `/api/usuarios/:id` | Sim | Retorna o perfil do próprio usuário |
| PUT | `/api/atualizar/usuarios/:id` | Sim | Troca a senha do usuário logado |
| GET | `/health` | Não | Verifica se a API está no ar |

## Segurança

- Senhas armazenadas com hash argon2.
- Token de sessão em cookie `httpOnly` e `sameSite=lax`, com `secure` em produção.
- Limite de tentativas por IP nas rotas de login e de recuperação de senha.
- Validação de todas as entradas com Zod, rejeitando campos extras.
- Tokens de redefinição de senha: aleatórios, de uso único, com validade curta e guardados no banco apenas como hash.
- A resposta de "Esqueceu a senha?" é a mesma para e-mails cadastrados e não cadastrados.

## Testes

```bash
cd back-end
npm test
```

## Observação

O cadastro e o login aceitam apenas e-mails `@gmail.com`.
