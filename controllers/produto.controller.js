const service = require("../services/produto.service");

function listar(req, res) {
  res.status(200).json(service.listar());
}

function buscarPorId(req, res) {
  const produto = service.buscarPorId(req.params.id);
  if (!produto) {
    return res.status(404).json({ erro: "Produto não encontrado" });
  }
  res.status(200).json(produto);
}

function criar(req, res) {
  try {
    const produto = service.criar(req.body);
    res.status(201).json(produto);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
}

module.exports = { listar, buscarPorId, criar };
