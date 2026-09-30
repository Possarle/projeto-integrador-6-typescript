import { Request, Response } from 'express';
import { ProdutoService } from '../services/produto.service';

type RequisicaoProduto = Request<{ id: string }>;

export class ProdutoController {
  constructor(private readonly service: ProdutoService) {}
  listar = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.listar());
  };
  buscarPorId = async (req: RequisicaoProduto, res: Response): Promise<void> => {
    res.status(200).json(await this.service.buscarPorId(req.params.id));
  };
  criar = async (req: Request, res: Response): Promise<void> => {
    const produto = await this.service.criar(req.body);
    res.location(`/produtos/${produto.id}`).status(201).json(produto);
  };
  atualizar = async (req: RequisicaoProduto, res: Response): Promise<void> => {
    res.status(200).json(await this.service.atualizar(req.params.id, req.body));
  };
  excluir = async (req: RequisicaoProduto, res: Response): Promise<void> => {
    await this.service.excluir(req.params.id);
    res.status(204).send();
  };
}
