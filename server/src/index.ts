import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { resumePendingAnalyses } from './services/analysis.js';

async function main() {
  await connectDB();
  await resumePendingAnalyses();

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});