import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startWalletCleanup } from './modules/wallets/wallet-cleanup.service.js';

async function start() {
  await connectDatabase();
  const stopWalletCleanup = startWalletCleanup();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`RJS backend listening on port ${env.PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    server.close(async () => {
      await stopWalletCleanup();
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Unable to start RJS backend:', error.message);
  process.exit(1);
});
