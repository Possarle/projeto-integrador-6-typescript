const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../app");
let server;
let url;

before(async () => {
  server = await new Promise((resolve) => {
    const servidor = app.listen(0, "127.0.0.1", () => resolve(servidor));
  });
  url = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

function cadastrar(dados) {
  return fetch(`${url}/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}

test("lista os produtos iniciais e busca pelo id", async () => {
  const resposta = await fetch(`${url}/produtos`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), [
    { id: 1, nome: "Notebook", preco: 3500 },
    { id: 2, nome: "Mouse", preco: 120 }
  ]);
  const busca = await fetch(`${url}/produtos/1`);
  assert.equal(busca.status, 200);
  assert.equal((await busca.json()).nome, "Notebook");
});

test("produto inexistente e rota desconhecida retornam 404", async () => {
  for (const caminho of ["/produtos/99999", "/produtos/abc", "/outra-rota"]) {
    const resposta = await fetch(url + caminho);
    assert.equal(resposta.status, 404);
    assert.equal(typeof (await resposta.json()).erro, "string");
  }
});

test("cadastro gera ids próprios e mantém o produto em memória", async () => {
  const resposta = await cadastrar({ id: 1, nome: " Teclado ", preco: 180 });
  assert.equal(resposta.status, 201);
  const produto = await resposta.json();
  assert.deepEqual(produto, { id: 3, nome: "Teclado", preco: 180 });
  const busca = await fetch(`${url}/produtos/${produto.id}`);
  assert.deepEqual(await busca.json(), produto);
  const segundo = await cadastrar({ nome: "Brinde", preco: 0 });
  assert.equal(segundo.status, 201);
  assert.equal((await segundo.json()).id, 4);
});

test("dados inválidos retornam 400 sem cadastrar produtos", async () => {
  const antes = await (await fetch(`${url}/produtos`)).json();
  for (const dados of [{}, { nome: " " , preco: 10 }, { nome: 123, preco: 10 },
    { nome: "Mouse" }, { nome: "Mouse", preco: "10" },
    { nome: "Mouse", preco: null }, { nome: "Mouse", preco: -1 }]) {
    const resposta = await cadastrar(dados);
    assert.equal(resposta.status, 400);
    assert.equal(typeof (await resposta.json()).erro, "string");
  }
  const semCorpo = await fetch(`${url}/produtos`, { method: "POST" });
  assert.equal(semCorpo.status, 400);
  const depois = await (await fetch(`${url}/produtos`)).json();
  assert.deepEqual(depois, antes);
});

test("JSON malformado retorna 400", async () => {
  const resposta = await fetch(`${url}/produtos`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"nome":'
  });
  assert.equal(resposta.status, 400);
  assert.deepEqual(await resposta.json(), { erro: "JSON inválido" });
});

test("model identifica a promoção pelo preço", () => {
  const Produto = require("../models/produto.model");
  assert.equal(new Produto({ id: 1, nome: "Cabo", preco: 99 }).estaEmPromocao(), true);
  assert.equal(new Produto({ id: 2, nome: "Mouse", preco: 100 }).estaEmPromocao(), false);
});
