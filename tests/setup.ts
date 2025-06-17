// tests/setup.ts
import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/User';
import { Task } from '../src/entities/Task';

// DataSource para testes (usando Oracle Database real)
export const TestDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1521'),
  username: process.env.DB_USERNAME || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  sid: process.env.DB_SID || 'XE',
  entities: [User, Task],
  synchronize: false, // Não alterar estrutura em testes
  logging: false,     // Desabilitar logs em testes
  dropSchema: false,  // Não dropar schema
});

// Setup global para todos os testes
beforeAll(async () => {
  try {
    await TestDataSource.initialize();
    console.log('🔌 Conectado ao Oracle Database para testes');
  } catch (error) {
    console.error('❌ Erro ao conectar no Oracle para testes:', error);
    throw error;
  }
});

afterAll(async () => {
  await TestDataSource.destroy();
  console.log('🔌 Conexão de teste fechada');
});

beforeEach(async () => {
  // Limpar dados entre testes (mas manter estrutura)
  try {
    // Substitui delete({}) por clear()
    await TestDataSource.getRepository(Task).clear();
    await TestDataSource.getRepository(User).clear();
  } catch (error) {
    console.warn('⚠️ Erro ao limpar dados de teste:', error);
  }
});

// Configurações de ambiente para testes
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
