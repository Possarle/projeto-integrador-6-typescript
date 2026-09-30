const express = require("express");
const produtoRoutes = require("./routes/produto.routes");

const app = express();
app.use(express.json());
app.use("/produtos", produtoRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((erro, req, res, next) => {
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }
  next(erro);
});

module.exports = app;
