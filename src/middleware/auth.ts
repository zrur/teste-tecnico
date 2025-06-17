import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}

/**
 * Middleware de autenticação JWT
 * Verifica o token Bearer no header Authorization
 * Injeta req.userId se válido, ou retorna 401 se inválido
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Injetar userId no request
    (req as any).userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    return res.status(401).json({ message: 'Falha na autenticação' });
  }
};