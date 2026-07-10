import { startApp } from './bootstrap/app.bootstrap';

startApp().catch((error: unknown) => {
  process.stderr.write(`Fatal bootstrap error: ${String(error)}\n`);
  process.exitCode = 1;
});
