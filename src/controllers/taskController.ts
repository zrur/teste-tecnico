import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AppDataSource } from '../database/data-source';
import { Task } from '../entities/Task';
import { User } from '../entities/User';

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);

// Validações separadas
export const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('dueDate').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
];

export const updateTaskValidation = [
  param('id').isNumeric().withMessage('ID deve ser um número'),
  body('title').optional().trim().notEmpty().withMessage('Título não pode estar vazio'),
  body('completed').optional().isBoolean().withMessage('Campo completed deve ser booleano'),
  body('dueDate').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
];

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Lista todas as tarefas do usuário autenticado
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarefas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   title:
 *                     type: string
 *                   completed:
 *                     type: boolean
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *       401:
 *         description: Token inválido ou expirado
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    const tasks = await taskRepository.find({
      where: { owner: { id: userId } },
      order: { id: 'DESC' }
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Busca uma tarefa específica por ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 title:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token inválido ou expirado
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID deve ser um número válido' });
    }

    const task = await taskRepository.findOne({
      where: { 
        id: taskId, 
        owner: { id: userId } 
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Cria uma nova tarefa
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 title:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou expirado
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const userId = (req as any).userId;
    const { title, dueDate } = req.body;

    // Buscar o usuário
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Criar nova tarefa
    const task = taskRepository.create({
      title,
      completed: 0, // Oracle: 0 = false, 1 = true
      dueDate: dueDate ? new Date(dueDate) : undefined,
      owner: user
    });

    const savedTask = await taskRepository.save(task);

    // Converter para resposta com boolean
    const response = {
      ...savedTask,
      completed: savedTask.completed === 1
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Atualiza uma tarefa existente
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *               completed:
 *                 type: boolean
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 title:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token inválido ou expirado
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);
    const { title, completed, dueDate } = req.body;

    // Buscar a tarefa
    const task = await taskRepository.findOne({
      where: { 
        id: taskId, 
        owner: { id: userId } 
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    // Atualizar campos permitidos
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    const updatedTask = await taskRepository.save(task);

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Remove uma tarefa
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID da tarefa
 *     responses:
 *       204:
 *         description: Tarefa removida com sucesso
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token inválido ou expirado
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID deve ser um número válido' });
    }

    // Verificar se a tarefa existe e pertence ao usuário
    const task = await taskRepository.findOne({
      where: { 
        id: taskId, 
        owner: { id: userId } 
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    // Remover a tarefa
    await taskRepository.delete(taskId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};