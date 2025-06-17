// src/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// src/types/index.ts
export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateTaskDto {
  title: string;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  completed?: boolean;
  dueDate?: Date;
}

export interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}