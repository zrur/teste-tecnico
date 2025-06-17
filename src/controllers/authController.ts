import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

// Validações separadas
export const registerValidation = [
  body('email').isEmail().withMessage('Email deve ser válido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Email deve ser válido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 email:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já está em uso
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Verificar se usuário já existe
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email já está em uso' });
    }

    // Hashear senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar novo usuário
    const user = userRepository.create({
      email,
      password: hashedPassword
    });

    // Salvar no banco
    const savedUser = await userRepository.save(user);

    // Retornar dados do usuário (sem a senha)
    res.status(201).json({
      id: savedUser.id,
      email: savedUser.email
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({ token });

  } catch (error) {
    next(error);
  }
};