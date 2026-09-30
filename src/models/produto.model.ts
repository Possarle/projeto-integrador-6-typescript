import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

export class Produto extends Model<InferAttributes<Produto>, InferCreationAttributes<Produto>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare preco: number;

  estaEmPromocao(): boolean {
    return this.preco < 100;
  }
}

export function definirProduto(banco: Sequelize): typeof Produto {
  // Uma classe por conexão mantém aplicações e testes independentes.
  class ProdutoConectado extends Produto {}
  ProdutoConectado.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true, len: [1, 120] } },
    preco: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: 0 } }
  }, { sequelize: banco, tableName: 'produtos', timestamps: false });
  return ProdutoConectado;
}
