import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from './config';

export const authMiddleWare = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req?.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Invalid token type/ no token' });
    }
    const token = authorization.split(' ')[1];
    try {
        const { userId } = jwt.verify(token, JWT_SECRET) as { userId: string }

        req.userId = userId;
        next();

    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}