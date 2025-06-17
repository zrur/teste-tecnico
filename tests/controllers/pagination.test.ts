// tests/controllers/pagination.test.ts

import request from 'supertest';
import express from 'express';
import { User } from '../../src/entities/User';
import { Task } from '../../src/entities/Task';
import { TestDataSource } from '../setup';
import { TestHelper } from '../helpers/testHelper';
import { getTasks, listTasksValidation } from '../../src/controllers/taskController';
import { authenticateToken } from '../../src/middleware/auth';

// Mock do AppDataSource para que use o TestDataSource
// em tests/controllers/pagination.test.ts e tests/controllers/taskController.test.ts
jest.mock('../../src/database/data-source', () => {
  // require dentro da factory para só resolver na hora que o mock for executado
  const { TestDataSource } = require('../setup');
  return {
    AppDataSource: {
      getRepository: (entity: any) => TestDataSource.getRepository(entity),
      createQueryBuilder: ()    => TestDataSource.createQueryBuilder(),
    }
  };
});

const app = express();
app.use(express.json());
app.get('/tasks', authenticateToken, listTasksValidation, getTasks);

describe('Paginação de Tarefas', () => {
  const testHelper = new TestHelper();
  let authToken: string;
  let testUser: User;

  beforeEach(async () => {
    // limpa dados de testes anteriores
    await testHelper.cleanup();

    // cria usuário e tarefas de teste
    testUser = await testHelper.createTestUser('test@example.com', '123456');
    authToken = testHelper.generateToken(testUser.id);
    await testHelper.createMultipleTasks(testUser, 25);
  });

  describe('Paginação básica', () => {
    it('deve retornar primeira página com 10 itens por padrão', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      });
    });

    it('deve retornar página específica', async () => {
      const response = await request(app)
        .get('/tasks?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      });
    });
  });

  describe('Validação de parâmetros', () => {
    it('deve retornar erro para página inválida', async () => {
      const response = await request(app)
        .get('/tasks?page=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Parâmetros inválidos');
    });

    it('deve retornar erro para limit muito alto', async () => {
      const response = await request(app)
        .get('/tasks?limit=150')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Parâmetros inválidos');
    });
  });
});
