import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

async function main() {
  const dbPath = path.resolve(__dirname, '../../pgdata/native-db');

  const pg = new EmbeddedPostgres({
    databaseDir: dbPath,
    user: 'postgres',
    password: 'password',
    port: 5433,
    persistent: true,
  });

  console.log('🐘 Initializing native PostgreSQL cluster...');
  try {
    await pg.initialise();
  } catch (err: any) {
    // Already initialized is fine
    console.log('Cluster already initialized or created.');
  }

  console.log('🚀 Starting native PostgreSQL server on port 5433...');
  await pg.start();
  console.log('🐘 PostgreSQL server is active on localhost:5433');

  try {
    await pg.createDatabase('velozity_db');
    console.log('✅ Created database velozity_db');
  } catch (err) {
    console.log('Database velozity_db exists or ready');
  }

  // Keep process alive
  const handleShutdown = async () => {
    console.log('Stopping PostgreSQL cluster...');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  // Keep Node event loop open
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error('Failed to run embedded postgres:', err);
  process.exit(1);
});
