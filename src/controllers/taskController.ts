import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { database } from '../database/Database';
import { AuthRequest } from '../middleware/auth';
import { CreateTaskDto, UpdateTaskDto } from '../types/Task';

export const createTaskValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Título é obrigatório'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().withMessage('Data deve estar no formato ISO8601')
];

export const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Título não pode estar vazio'),
  body('description').optional().trim(),
  body('status').optional().isIn(['pending', 'completed']).withMessage('Status deve ser pending ou completed'),
  body('dueDate').optional().isISO8601().withMessage('Data deve estar no formato ISO8601')
];

export const getTasks = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { status } = req.query;

    const tasks = database.findTasksByUserId(userId, status as string);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getTaskById = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const taskId = parseInt(req.params.id);

    const task = database.findTaskById(taskId, userId);
    if (!task) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createTask = (req: AuthRequest, res: Response): void => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.userId!;
    const { title, description, dueDate }: CreateTaskDto = req.body;

    const task = database.createTask({
      title,
      description,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateTask = (req: AuthRequest, res: Response): void => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.userId!;
    const taskId = parseInt(req.params.id);
    const updates: UpdateTaskDto = req.body;

    const updatedTask = database.updateTask(taskId, userId, {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined
    });

    if (!updatedTask) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteTask = (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const taskId = parseInt(req.params.id);

    const deleted = database.deleteTask(taskId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
