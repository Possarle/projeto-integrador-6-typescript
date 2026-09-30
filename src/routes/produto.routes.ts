import { Router } from 'express';
import { ProdutoController } from '../controllers/produto.controller';
import { ProdutoService } from '../services/produto.service';

export function criarRotas(service: ProdutoService): Router {
  const router = Router();
  const controller = new ProdutoController(service);
  router.get('/', controller.listar);
  router.get('/:id', controller.buscarPorId);
  router.post('/', controller.criar);
  router.put('/:id', controller.atualizar);
  router.delete('/:id', controller.excluir);
  return router;
}
