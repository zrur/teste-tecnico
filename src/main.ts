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
// ✅ CORREÇÃO: Garantir que PORT seja sempre number
const PORT = parseInt(process.env.PORT || '3000');

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
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Informações da API
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: Informações básicas da API
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Todo API',
    version: '1.0.0',
    description: 'API REST para gerenciamento de tarefas',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login'
      },
      tasks: {
        list: 'GET /tasks',
        create: 'POST /tasks',
        get: 'GET /tasks/:id',
        update: 'PUT /tasks/:id',
        delete: 'DELETE /tasks/:id'
      }
    },
    timestamp: new Date().toISOString()
  });
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
  
  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  res.status(err.status || 500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Rota 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Inicializar o banco de dados e servidor
const startServer = async () => {
  try {
    console.log('🔄 Inicializando servidor...');
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Porta: ${PORT}`);
    
    // Inicializar conexão com o banco
    await AppDataSource.initialize();
    console.log('✅ Conexão com o banco de dados estabelecida');
    
    // Sincronizar schema em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      await AppDataSource.synchronize();
      console.log('🔄 Schema do banco sincronizado');
    }
    
    // ✅ CORREÇÃO: HOST binding correto para Railway
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    // ✅ PORT agora é garantidamente number
    app.listen(PORT, host, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 URL: http://${host}:${PORT}`);
      console.log(`🏥 Health check: http://${host}:${PORT}/health`);
      console.log(`📚 Documentação Swagger: http://${host}:${PORT}/api-docs`);
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
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Recebido SIGTERM, finalizando servidor...');
  
  try {
    await AppDataSource.destroy();
    console.log('✅ Conexão com banco fechada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 Recebido SIGINT, finalizando servidor...');
  
  try {
    await AppDataSource.destroy();
    console.log('✅ Conexão com banco fechada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
    process.exit(1);
  }
});

// Iniciar aplicação
startServer();

export { app };