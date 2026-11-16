import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server is running on PORT : ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});