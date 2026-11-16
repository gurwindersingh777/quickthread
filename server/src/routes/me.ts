import { Router } from 'express';
import { currentUser, requireUser } from '../middleware/requireUser.js';

export const meRouter = Router();

meRouter.get('/', requireUser, (_req, res) => {
  const user = currentUser(res);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
  });
});