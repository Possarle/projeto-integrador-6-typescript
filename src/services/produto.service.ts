import { Produto } from '../models/produto.model';
import { HttpError } from '../errors/http-error';

export interface DadosProduto { nome: string; preco: number }

export function validarProduto(dados: unknown): DadosProduto {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new HttpError(400, 'Informe os dados do produto');
  }
  const { nome, preco } = dados as Record<string, unknown>;
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 120) {
    throw new HttpError(400, 'Informe um nome com 1 a 120 caracteres');
  }
  if (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0 || preco > 999999999.99 || Math.abs(preco * 100 - Math.round(preco * 100)) > 0.00001) {
    throw new HttpError(400, 'Informe um preco entre 0 e 999999999.99, com até duas casas decimais');
  }
  return { nome: nome.trim(), preco };
}

export class ProdutoService {
  constructor(private readonly model: typeof Produto) {}

  listar(): Promise<Produto[]> {
    return this.model.findAll({ order: [['id', 'ASC']] });
  }

  async buscarPorId(id: string): Promise<Produto> {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      throw new HttpError(404, 'Produto não encontrado');
    }
    const produto = await this.model.findByPk(Number(id));
    if (!produto) throw new HttpError(404, 'Produto não encontrado');
    return produto;
  }

  criar(dados: unknown): Promise<Produto> {
    return this.model.create(validarProduto(dados));
  }

  async atualizar(id: string, dados: unknown): Promise<Produto> {
    const produto = await this.buscarPorId(id);
    return produto.update(validarProduto(dados));
  }

  async excluir(id: string): Promise<void> {
    const produto = await this.buscarPorId(id);
    await produto.destroy();
  }
}
