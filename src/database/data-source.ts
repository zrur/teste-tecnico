// src/database/data-source.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1521'),
  username: process.env.DB_USERNAME || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  sid: process.env.DB_SID || 'XE', // ou use serviceName se preferir
  // serviceName: process.env.DB_SERVICE_NAME || 'XEPDB1', // alternativa ao SID
  synchronize: process.env.NODE_ENV !== 'production', // true apenas em desenvolvimento
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Task],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
});