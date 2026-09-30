import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { criarBanco } from './config/database';
import { criarApp } from './app';

async function iniciar(): Promise<void> {
  const storage = process.env.DB_STORAGE ?? path.resolve('data/produtos.sqlite');
  if (storage !== ':memory:') mkdirSync(path.dirname(storage), { recursive: true });
  const banco = criarBanco(storage);
  const { app } = criarApp(banco);
  // Cria tabelas ausentes sem apagar ou alterar os dados existentes.
  await banco.sync();
  const port = Number(process.env.PORT ?? 3000);
  const server = app.listen(port, () => console.log(`Aplicação: http://localhost:${port}`));
  const encerrar = () => server.close(() => { void banco.close(); });
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}

iniciar().catch((erro: unknown) => { console.error('Falha ao iniciar:', erro); process.exitCode = 1; });
