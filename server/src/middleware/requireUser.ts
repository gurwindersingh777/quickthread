import type { NextFunction, Request, Response } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { User, type UserDocument } from '../models/User.js';

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let user = await User.findOne({ clerkId: userId });

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const primary =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ??
      clerkUser.emailAddresses[0];

    if (!primary) {
      res.status(400).json({ error: 'Your account has no email address' });
      return;
    }

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ');

    user = await User.findOneAndUpdate(
      { email: primary.emailAddress.toLowerCase() },
      { $set: { clerkId: userId, name, imageUrl: clerkUser.imageUrl } },
      { new: true, upsert: true },
    );
  }

  res.locals.user = user;
  next();
}

export function currentUser(res: Response) {
  return res.locals.user as UserDocument;
}