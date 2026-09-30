import express, { ErrorRequestHandler } from 'express';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import { definirProduto } from './models/produto.model';
import { ProdutoService } from './services/produto.service';
import { criarRotas } from './routes/produto.routes';
import { HttpError } from './errors/http-error';

export function criarApp(banco: Sequelize) {
  const model = definirProduto(banco);
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.use('/produtos', criarRotas(new ProdutoService(model)));
  app.use(express.static(path.resolve(__dirname, '../public')));
  app.use((_req, res) => { res.status(404).json({ erro: 'Rota não encontrada' }); });
  const tratarErro: ErrorRequestHandler = (erro: unknown, _req, res, _next) => {
    if (erro instanceof HttpError) {
      res.status(erro.status).json({ erro: erro.message });
    } else if (erro && typeof erro === 'object' && 'type' in erro && erro.type === 'entity.parse.failed') {
      res.status(400).json({ erro: 'JSON inválido' });
    } else if (erro && typeof erro === 'object' && 'type' in erro && erro.type === 'entity.too.large') {
      res.status(413).json({ erro: 'Corpo da requisição muito grande' });
    } else {
      console.error(erro);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  };
  app.use(tratarErro);
  return { app, model };
}
