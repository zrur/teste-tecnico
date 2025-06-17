// src/main.ts
import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './database/data-source';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';

// Controllers
import { register, login, registerValidation, loginValidation } from './controllers/authController';
import {
   getTasks,
   getTaskById,
   createTask,
   updateTask,
   deleteTask,
  createTaskValidation,
  updateTaskValidation
 } from './controllers/taskController';
import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json());

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verificação de saúde da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: API funcionando!
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API funcionando!' });
});

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rota para o JSON do Swagger
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas de autenticação
app.post('/auth/register', registerValidation, register);
app.post('/auth/login', loginValidation, login);

// Rotas de tarefas (protegidas)
app.get('/tasks', authenticateToken, getTasks);
app.get('/tasks/:id', authenticateToken, getTaskById);
app.post('/tasks', authenticateToken, createTaskValidation, createTask);
app.put('/tasks/:id', authenticateToken, updateTaskValidation, updateTask);
app.delete('/tasks/:id', authenticateToken, deleteTask);

// Middleware de erro global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar o banco de dados e servidor
const startServer = async () => {
  try {
    // Inicializar conexão com o banco
    await AppDataSource.initialize();
    console.log('✅ Conexão com o banco de dados estabelecida');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Documentação Swagger: http://localhost:${PORT}/api-docs`);
      console.log('');
      console.log('📚 Endpoints disponíveis:');
      console.log('  POST /auth/register - Cadastro');
      console.log('  POST /auth/login - Login');
      console.log('  GET /tasks - Listar tarefas');
      console.log('  POST /tasks - Criar tarefa');
      console.log('  GET /tasks/:id - Buscar tarefa');
      console.log('  PUT /tasks/:id - Atualizar tarefa');
      console.log('  DELETE /tasks/:id - Excluir tarefa');
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar o servidor:', error);
    process.exit(1);
  }
};

// Iniciar aplicação
startServer();

export { app };