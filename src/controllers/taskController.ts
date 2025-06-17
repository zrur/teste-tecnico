import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
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

export const listTasksValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número maior que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('completed').optional().isBoolean().withMessage('Completed deve ser boolean'),
  query('search').optional().isString().withMessage('Search deve ser string'),
];

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Lista todas as tarefas do usuário autenticado com paginação
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de conclusão
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar no título das tarefas
 *     responses:
 *       200:
 *         description: Lista paginada de tarefas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Token inválido ou expirado
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Parâmetros inválidos', 
        errors: errors.array() 
      });
    }

    const userId = (req as any).userId;
    
    // Parâmetros de paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const completed = req.query.completed;
    const search = req.query.search as string;

    // Construir query
    const queryBuilder = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .where('owner.id = :userId', { userId });

    // Filtro por completed
    if (completed !== undefined) {
      const completedValue = completed === 'true' ? 1 : 0;
      queryBuilder.andWhere('task.completed = :completed', { completed: completedValue });
    }

    // Filtro por busca no título
    if (search) {
      queryBuilder.andWhere('LOWER(task.title) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    // Ordenação
    queryBuilder.orderBy('task.id', 'DESC');

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Executar query
    const [tasks, total] = await queryBuilder.getManyAndCount();

    // Converter completed de number para boolean na resposta
    const tasksWithBooleanCompleted = tasks.map(task => ({
      ...task,
      completed: task.completed === 1,
      owner: undefined // Remover dados do owner da resposta
    }));

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      data: tasksWithBooleanCompleted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
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

    // Converter completed para boolean
    const taskResponse = {
      ...task,
      completed: task.completed === 1
    };

    res.json(taskResponse);
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
      completed: savedTask.completed === 1,
      owner: undefined // Remover dados do owner
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
    if (completed !== undefined) task.completed = completed ? 1 : 0; // Converter boolean para number
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    const updatedTask = await taskRepository.save(task);

    // Converter para resposta com boolean
    const response = {
      ...updatedTask,
      completed: updatedTask.completed === 1,
      owner: undefined // Remover dados do owner
    };

    res.json(response);
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