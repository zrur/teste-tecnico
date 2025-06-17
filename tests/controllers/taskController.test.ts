// tests/controllers/taskController.test.ts

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createTaskValidation,
  updateTaskValidation
} from '../../src/controllers/taskController';
import { authenticateToken } from '../../src/middleware/auth';
import { User } from '../../src/entities/User';
import { Task } from '../../src/entities/Task';
import { TestDataSource } from '../setup';

// Mock do AppDataSource (usando TestDataSource) — require só dentro da factory para evitar hoisting
jest.mock('../../src/database/data-source', () => {
  const { TestDataSource } = require('../setup');
  return {
    AppDataSource: {
      getRepository: (entity: any) => TestDataSource.getRepository(entity),
    },
  };
});

const app = express();
app.use(express.json());
app.get('/tasks', authenticateToken, getTasks);
app.get('/tasks/:id', authenticateToken, getTaskById);
app.post('/tasks', authenticateToken, createTaskValidation, createTask);
app.put('/tasks/:id', authenticateToken, updateTaskValidation, updateTask);
app.delete('/tasks/:id', authenticateToken, deleteTask);

describe('TaskController', () => {
  const userRepository = TestDataSource.getRepository(User);
  const taskRepository = TestDataSource.getRepository(Task);
  let authToken: string;
  let testUser: User;

  beforeEach(async () => {
    // limpar dados entre testes
    await TestDataSource.getRepository(Task).clear();
    await TestDataSource.getRepository(User).clear();

    // criar e salvar usuário de teste
    const hashedPassword = await bcrypt.hash('123456', 10);
    testUser = userRepository.create({
      email: 'test@example.com',
      password: hashedPassword
    });
    await userRepository.save(testUser);

    // gerar token JWT
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  describe('GET /tasks', () => {
    it('deve listar tarefas do usuário', async () => {
      const task1 = taskRepository.create({
        title: 'Tarefa 1',
        completed: 0,
        owner: testUser
      });
      const task2 = taskRepository.create({
        title: 'Tarefa 2',
        completed: 1,
        owner: testUser
      });
      await taskRepository.save([task1, task2]);

      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('completed');
    });

    it('deve retornar lista vazia para usuário sem tarefas', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('deve retornar erro 401 sem token', async () => {
      await request(app)
        .get('/tasks')
        .expect(401);
    });
  });

  describe('GET /tasks/:id', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = taskRepository.create({
        title: 'Tarefa de teste',
        completed: 0,
        owner: testUser
      });
      await taskRepository.save(testTask);
    });

    it('deve retornar tarefa específica', async () => {
      const response = await request(app)
        .get(`/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testTask.id);
      expect(response.body).toHaveProperty('title', 'Tarefa de teste');
    });

    it('deve retornar 404 para tarefa inexistente', async () => {
      const response = await request(app)
        .get('/tasks/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tarefa não encontrada');
    });
  });

  describe('POST /tasks', () => {
    it('deve criar nova tarefa', async () => {
      const taskData = {
        title: 'Nova tarefa',
        dueDate: '2024-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', taskData.title);
      expect(response.body).toHaveProperty('completed', false);

      const savedTask = await taskRepository.findOne({
        where: { id: response.body.id }
      });
      expect(savedTask).toBeTruthy();
    });

    it('deve retornar erro para título vazio', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Dados inválidos');
    });
  });

  describe('PUT /tasks/:id', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = taskRepository.create({
        title: 'Tarefa original',
        completed: 0,
        owner: testUser
      });
      await taskRepository.save(testTask);
    });

    it('deve atualizar tarefa existente', async () => {
      const updateData = {
        title: 'Tarefa atualizada',
        completed: true
      };

      const response = await request(app)
        .put(`/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('completed', true);
    });

    it('deve retornar 404 para tarefa inexistente', async () => {
      const response = await request(app)
        .put('/tasks/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Atualização' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tarefa não encontrada');
    });
  });

  describe('DELETE /tasks/:id', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = taskRepository.create({
        title: 'Tarefa para deletar',
        completed: 0,
        owner: testUser
      });
      await taskRepository.save(testTask);
    });

    it('deve deletar tarefa existente', async () => {
      await request(app)
        .delete(`/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deletedTask = await taskRepository.findOne({
        where: { id: testTask.id }
      });
      expect(deletedTask).toBeFalsy();
    });

    it('deve retornar 404 para tarefa inexistente', async () => {
      const response = await request(app)
        .delete('/tasks/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tarefa não encontrada');
    });
  });
});
