const Produto = require("../models/produto.model");

const produtos = [
  new Produto({ id: 1, nome: "Notebook", preco: 3500 }),
  new Produto({ id: 2, nome: "Mouse", preco: 120 })
];
let proximoId = 3;

function listar() {
  return produtos;
}

function buscarPorId(id) {
  return produtos.find((produto) => produto.id === Number(id));
}

function criar(dados) {
  if (!dados || typeof dados.nome !== "string" || !dados.nome.trim()) {
    throw new Error("Informe um nome válido para o produto");
  }
  if (typeof dados.preco !== "number" || !Number.isFinite(dados.preco) || dados.preco < 0) {
    throw new Error("Informe um preco numérico maior ou igual a zero");
  }

  const produto = new Produto({
    id: proximoId++,
    nome: dados.nome.trim(),
    preco: dados.preco
  });
  produtos.push(produto);
  return produto;
}

module.exports = { listar, buscarPorId, criar };
