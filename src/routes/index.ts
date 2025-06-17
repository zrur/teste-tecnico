// src/routes/index.ts
import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as taskController from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rotas públicas - Autenticação
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Middleware de autenticação para todas as rotas abaixo
router.use(authenticateToken);

// Rotas protegidas - Tarefas
router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

export default router;