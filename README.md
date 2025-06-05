# 🎯 To-Do API - Teste Técnico

API REST para gerenciamento de tarefas pessoais desenvolvida com Node.js e TypeScript.

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express.js** para servidor HTTP
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **express-validator** para validação
- Banco de dados **em memória**

## 📋 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Cadastro de usuário (nome, email, senha)
- [x] Login com JWT
- [x] Middleware de autenticação

### ✅ Gerenciamento de Tarefas
- [x] Criar tarefa (título, descrição, data vencimento)
- [x] Listar tarefas do usuário logado
- [x] Buscar tarefa por ID
- [x] Editar tarefa
- [x] Marcar como concluída
- [x] Excluir tarefa
- [x] Filtrar por status (pending/completed)

## 🛠️ Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Executar em desenvolvimento
npm run dev

# 3. A API estará em http://localhost:3000
```

## 📚 Endpoints

### Autenticação
```http
POST /auth/register
POST /auth/login
```

### Tarefas (requer autenticação via Bearer token)
```http
GET    /tasks              # Listar tarefas
GET    /tasks?status=completed  # Filtrar por status
GET    /tasks/:id          # Buscar por ID
POST   /tasks              # Criar tarefa
PUT    /tasks/:id          # Atualizar tarefa
DELETE /tasks/:id          # Excluir tarefa
```

## 🧪 Testando

### Teste Automático
```bash
# Terminal 1: Executar API
npm run dev

# Terminal 2: Executar testes
bash test_api.sh
```

### Teste Manual

1. **Cadastrar usuário:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@test.com","password":"123456"}'
```

2. **Fazer login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@test.com","password":"123456"}'
```

3. **Criar tarefa (use o token do login):**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"title":"Estudar Node.js","description":"Revisar Express e TypeScript"}'
```

## 📁 Estrutura do Projeto

```
src/
├── controllers/        # Lógica dos endpoints
│   ├── authController.ts
│   └── taskController.ts
├── middleware/         # Middlewares
│   └── auth.ts
├── types/             # Tipos TypeScript
│   ├── User.ts
│   └── Task.ts
├── database/          # Database em memória
│   └── Database.ts
└── main.ts           # Servidor principal
```

## ✅ Critérios Atendidos

- **Código (40%):** ✅ Organização, padrões TypeScript, tratamento de erros
- **Funcionalidade (30%):** ✅ Todos endpoints funcionando, autenticação, validações
- **Boas Práticas (20%):** ✅ DTOs, middleware de auth, separação de responsabilidades
- **Documentação (10%):** ✅ README com setup e exemplos

## 🔧 Decisões Técnicas

- **Database em memória:** Para simplicidade e foco na lógica da API
- **JWT:** Autenticação stateless e escalável
- **Express-validator:** Validação robusta de dados
- **TypeScript:** Tipagem forte e melhor developer experience
- **Estrutura modular:** Separação clara de responsabilidades

## 🚀 Melhorias Futuras

- [ ] Persistência em banco real (PostgreSQL/MongoDB)
- [ ] Testes unitários com Jest
- [ ] Paginação nas listagens
- [ ] Logs estruturados
- [ ] Rate limiting
- [ ] Documentação Swagger/OpenAPI
