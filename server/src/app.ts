import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import { meRouter } from './routes/me.js';
import { env } from './config/env.js';
import { demoRouter } from './routes/demo.js';

export const app = express();

const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(clerkMiddleware());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/me', meRouter);
app.use('/api/demo', demoRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});