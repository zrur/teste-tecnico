// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'To-Do API',
      version: '1.0.0',
      description: 'API REST para gerenciamento de tarefas com autenticação JWT',
      contact: {
        name: 'Desenvolvedor',
        email: 'dev@todoapi.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://sua-api.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT no formato: Bearer {seu-token}'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', format: 'email', example: 'usuario@email.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Minha tarefa importante' },
            completed: { type: 'boolean', example: false },
            dueDate: { 
              type: 'string', 
              format: 'date-time', 
              nullable: true,
              example: '2024-12-31T23:59:59.000Z'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { 
              type: 'string', 
              format: 'email',
              example: 'usuario@email.com',
              description: 'Email válido para cadastro'
            },
            password: { 
              type: 'string', 
              minLength: 6,
              example: '123456',
              description: 'Senha com pelo menos 6 caracteres'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { 
              type: 'string', 
              format: 'email',
              example: 'usuario@email.com'
            },
            password: { 
              type: 'string',
              example: '123456'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { 
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'Token JWT válido por 1 hora'
            }
          }
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { 
              type: 'string',
              example: 'Estudar Node.js',
              description: 'Título da tarefa'
            },
            dueDate: { 
              type: 'string', 
              format: 'date-time',
              nullable: true,
              example: '2024-12-31T23:59:59.000Z',
              description: 'Data de vencimento opcional'
            }
          }
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: { 
              type: 'string',
              example: 'Estudar Node.js - Atualizado'
            },
            completed: { 
              type: 'boolean',
              example: true
            },
            dueDate: { 
              type: 'string', 
              format: 'date-time',
              nullable: true,
              example: '2024-12-31T23:59:59.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { 
              type: 'string',
              example: 'Mensagem de erro'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Operações de autenticação (registro e login)'
      },
      {
        name: 'Tasks',
        description: 'Operações CRUD de tarefas (requer autenticação)'
      },
      {
        name: 'Health',
        description: 'Verificação de saúde da API'
      }
    ]
  },
  apis: [
    './src/controllers/*.ts',
    './src/main.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
  `,
  customSiteTitle: 'To-Do API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true
  }
};