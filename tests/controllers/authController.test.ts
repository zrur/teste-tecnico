// tests/controllers/authController.test.ts

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { TestHelper } from '../helpers/testHelper';
import { TestDataSource } from '../setup';
import { register, login, registerValidation, loginValidation } from '../../src/controllers/authController';

// Mock do AppDataSource usando TestDataSource, carregado só quando o mock é executado
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
app.post('/auth/register', registerValidation, register);
app.post('/auth/login', loginValidation, login);

describe('AuthController com Oracle Database', () => {
  const testHelper = new TestHelper();
  let testUser: { id: number; email: string };
  let authToken: string;

  beforeAll(async () => {
    const ok = await testHelper.checkConnection();
    if (!ok) {
      throw new Error('Oracle Database não está disponível para testes');
    }
  });

  beforeEach(async () => {
    // limpa usuários/tarefas entre cada teste
    await testHelper.cleanup();
  });

  describe('POST /auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123456'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', userData.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('deve validar dados inválidos', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: '123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // cria um usuário para testar o login
      testUser = await testHelper.createTestUser('user@ex.com', 'password123');
    });

    it('deve autenticar com credenciais corretas', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      // opcional: decodificar e verificar payload
      const payload = jwt.verify(res.body.token, process.env.JWT_SECRET!);
      expect((payload as any).userId).toBe(testUser.id);
    });

    it('deve retornar 401 com credenciais incorretas', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpass' })
        .expect(401);
    });
  });
});
