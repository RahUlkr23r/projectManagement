import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { setupWebSocketServer } from './websocket/ws.server';
import { startOverdueTaskJob } from './jobs/overdue.job';

const bootstrap = async (): Promise<void> => {
  const app = createApp();
  const httpServer = http.createServer(app);

  // 1. Initialize Real-Time WebSocket Infrastructure
  setupWebSocketServer(httpServer);

  // 2. Initialize Background Overdue Task Scheduler
  const overdueJob = startOverdueTaskJob();

  // 3. Start HTTP Listener
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 Accepting client requests from ${env.CLIENT_URL}`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    overdueJob.stop();
    httpServer.close(() => {
      console.log('HTTP and WebSocket server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

bootstrap().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
