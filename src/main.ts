import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

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

// Rota de saúde
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API funcionando!' });
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
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
