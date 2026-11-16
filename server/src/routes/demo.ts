import { Router } from 'express';
import { clerkClient } from '@clerk/express';
import { z } from 'zod';
import { DEMO_ACCOUNTS } from '../demo.js';
import { User } from '../models/User.js';

export const demoRouter = Router();

const bodySchema = z.object({ role: z.enum(['assistant', 'client']) });

demoRouter.post('/login', async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const account = DEMO_ACCOUNTS[parsed.data.role];
  const user = await User.findOne({ email: account.email });

  if (!user?.clerkId) {
    res.status(404).json({ error: 'Demo accounts are not set up yet' });
    return;
  }

  const signInToken = await clerkClient.signInTokens.createSignInToken({
    userId: user.clerkId,
    expiresInSeconds: 60,
  });

  res.json({ token: signInToken.token });
});