import mongoose from 'mongoose';
import { clerkClient } from '@clerk/express';
import { DEMO_ACCOUNTS } from '../demo.js';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';
import { importSampleInbox } from '../services/inbox.js';

async function ensureClerkUser(email: string, firstName: string) {
  const existing = await clerkClient.users.getUserList({ emailAddress: [email] });
  if (existing.data.length > 0) return existing.data[0];

  return clerkClient.users.createUser({
    emailAddress: [email],
    firstName,
    skipPasswordRequirement: true,
  });
}

async function main() {
  await connectDB();

  const { assistant, client } = DEMO_ACCOUNTS;
  const aliceClerk = await ensureClerkUser(assistant.email, assistant.firstName);
  const jamesClerk = await ensureClerkUser(client.email, client.firstName);

  const alice = await User.findOneAndUpdate(
    { email: assistant.email },
    { $set: { clerkId: aliceClerk.id, name: assistant.firstName, role: 'assistant' } },
    { new: true, upsert: true },
  );
  if (!alice) throw new Error('Failed to seed the assistant');

  await User.findOneAndUpdate(
    { email: client.email },
    {
      $set: {
        clerkId: jamesClerk.id,
        name: client.firstName,
        role: 'client',
        assistantId: alice._id,
      },
    },
    { new: true, upsert: true },
  );

  const reset = process.argv.includes('--reset');
  const inbox = await importSampleInbox(alice._id, 'gmail', { reset });
  console.log(
    inbox.created
      ? `Imported ${inbox.imported} sample threads into Alice's connected Gmail account`
      : "Alice already has a connected inbox (run 'npm run seed:reset' to re-import it)",
  );
  console.log('Seeded demo users: Alice (assistant) and James (client, managed by Alice)');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});