import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso ausente ou inválido' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
      console.error("JWT_SECRET não está definido no ambiente.");
      return res.status(500).json({ error: "Erro de configuração do servidor." });
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    // Adiciona o payload completo do usuário ao objeto de requisição
    (req as any).user = decoded; 
    
    // Validação específica para garantir que 'ids' seja um array
    if (!Array.isArray((decoded as any).ids)) {
        // Se não for um array, pode ser um token antigo ou malformado
        if (typeof (decoded as any).id === 'number') {
            // Converte o formato antigo para o novo para manter compatibilidade
            (req as any).user.ids = [(decoded as any).id];
        } else {
             return res.status(403).json({ error: 'Formato de token inválido.' });
        }
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};
