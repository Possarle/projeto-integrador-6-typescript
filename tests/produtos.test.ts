import request from 'supertest';
import { criarBanco } from '../src/config/database';
import { criarApp } from '../src/app';
import { validarProduto } from '../src/services/produto.service';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const banco = criarBanco(':memory:');
const { app, model } = criarApp(banco);
beforeEach(async () => { await banco.sync({ force: true }); });
afterEach(() => jest.restoreAllMocks());
afterAll(async () => { await banco.close(); });

test('CRUD completo: cadastra, lista, consulta, edita e exclui no banco', async () => {
  expect((await request(app).get('/produtos')).body).toEqual([]);
  const criado = await request(app).post('/produtos').send({ id: 77, nome: ' Teclado ', preco: 180, extra: true }).expect(201);
  const id = criado.body.id as number;
  expect(criado.headers.location).toBe(`/produtos/${id}`);
  expect(criado.body).toEqual({ id, nome: 'Teclado', preco: 180 });
  expect(await model.count()).toBe(1);
  expect((await request(app).get('/produtos')).body).toEqual([criado.body]);
  expect((await request(app).get(`/produtos/${id}`).expect(200)).body).toEqual(criado.body);
  const alterado = await request(app).put(`/produtos/${id}`).send({ id: 55, nome: ' Mouse ', preco: 59.90 }).expect(200);
  expect(alterado.body).toEqual({ id, nome: 'Mouse', preco: 59.9 });
  expect((await model.findByPk(id))!.preco).toBe(59.9);
  await request(app).delete(`/produtos/${id}`).expect(204).expect('');
  await request(app).get(`/produtos/${id}`).expect(404);
  expect(await model.count()).toBe(0);
});

test.each(['9999', 'abc', '0', '-1', '1.5', '1e0', '01', '9007199254740992'])('ids inexistentes/inválidos: %s', async id => {
  await request(app).get(`/produtos/${id}`).expect(404);
  await request(app).put(`/produtos/${id}`).send({ nome: 'Item', preco: 1 }).expect(404);
  await request(app).delete(`/produtos/${id}`).expect(404);
});

test.each([
  {}, [], { nome: ' ', preco: 1 }, { nome: 123, preco: 1 }, { nome: 'x'.repeat(121), preco: 1 },
  { nome: 'Item' }, { nome: 'Item', preco: '10' }, { nome: 'Item', preco: null },
  { nome: 'Item', preco: -1 }, { nome: 'Item', preco: 1.234 }, { nome: 'Item', preco: 1000000000 }
])('rejeita cadastro e edição inválidos sem modificar o banco: %j', async dados => {
  const produto = await model.create({ nome: 'Original', preco: 10 });
  await request(app).post('/produtos').send(dados).expect(400);
  await request(app).put(`/produtos/${produto.id}`).send(dados).expect(400);
  await produto.reload();
  expect(produto.nome).toBe('Original');
  expect(produto.preco).toBe(10);
  expect(await model.count()).toBe(1);
});

test('limites válidos, preço zero e ordenação por id', async () => {
  const primeiro = await request(app).post('/produtos').send({ nome: 'Brinde', preco: 0 }).expect(201);
  const segundo = await request(app).post('/produtos').send({ nome: 'x'.repeat(120), preco: 999999999.99 }).expect(201);
  expect(segundo.body.id).not.toBe(primeiro.body.id);
  expect((await request(app).get('/produtos')).body).toEqual([primeiro.body, segundo.body]);
});

test.each([undefined, null, false, 10, 'texto', { nome: 'Item', preco: NaN }, { nome: 'Item', preco: Infinity }])('valida entradas não representáveis em JSON: %j', dados => {
  expect(() => validarProduto(dados)).toThrow();
});

test('corpo ausente, JSON inválido, payload excessivo e rota desconhecida', async () => {
  await request(app).post('/produtos').expect(400);
  await request(app).post('/produtos').set('Content-Type', 'application/json').send('{"nome":').expect(400, { erro: 'JSON inválido' });
  await request(app).post('/produtos').send({ nome: 'x'.repeat(20000), preco: 1 }).expect(413);
  await request(app).get('/inexistente').expect(404, { erro: 'Rota não encontrada' });
});

test('falha de persistência retorna 500 sem expor detalhes internos', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(model, 'findAll').mockRejectedValueOnce(new Error('segredo do banco'));
  await request(app).get('/produtos').expect(500, { erro: 'Erro interno do servidor' });
  jest.spyOn(model, 'findAll').mockRejectedValueOnce(null);
  await request(app).get('/produtos').expect(500);
  expect(log).toHaveBeenCalled();
});

test('interface é servida na página inicial', async () => {
  const resposta = await request(app).get('/').expect(200);
  expect(resposta.text).toContain('produto-form');
  await request(app).get('/styles.css').expect(200);
});

test('regra de promoção original permanece no model', () => {
  expect(model.build({ nome: 'Cabo', preco: 99.99 }).estaEmPromocao()).toBe(true);
  expect(model.build({ nome: 'Mouse', preco: 100 }).estaEmPromocao()).toBe(false);
});

test('SQLite mantém dados após fechar e reabrir a conexão', async () => {
  const pasta = await mkdtemp(path.join(os.tmpdir(), 'pi6-'));
  const arquivo = path.join(pasta, 'teste.sqlite');
  const primeiro = criarBanco(arquivo);
  const segunda = criarBanco(arquivo);
  try {
    const inicial = criarApp(primeiro);
    await primeiro.sync();
    const resposta = await request(inicial.app).post('/produtos').send({ nome: 'Persistente', preco: 25 }).expect(201);
    await primeiro.close();
    const reaberto = criarApp(segunda);
    await segunda.sync();
    expect((await request(reaberto.app).get(`/produtos/${resposta.body.id}`).expect(200)).body.nome).toBe('Persistente');
  } finally {
    await segunda.close();
    await rm(pasta, { recursive: true, force: true });
  }
});
