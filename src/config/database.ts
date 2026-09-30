import { Sequelize } from 'sequelize';

export function criarBanco(storage: string): Sequelize {
  return new Sequelize({ dialect: 'sqlite', storage, logging: false });
}
